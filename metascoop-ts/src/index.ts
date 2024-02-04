import 'source-map-support/register';

import { Octokit } from "octokit";
import { startGroup, endGroup, error } from '@actions/core';
import { exec } from '@actions/exec';
import { load as loadYaml, dump as dumpYaml } from 'js-yaml';
import fsxt from 'fsxt';
import path from 'path';
import { components } from '@octokit/openapi-types';
import { IndexV1 } from "./repo-index-types";
import { FDroidDataMetadata2 } from "./metadata-types";
import { parse, compare } from 'semver';
import { Entry, Files, GraphqlResult, Release, ReleaseAsset } from "./graphql";
import Handlebars from 'handlebars';

// https://stackoverflow.com/questions/6832596/how-can-i-compare-software-version-number-using-javascript-only-numbers
function versionCompare(v1: string, v2: string, options?: { lexicographical?: boolean, zeroExtend?: boolean }) {
    let lexicographical = options && options.lexicographical;
    let zeroExtend = options && options.zeroExtend;
    let v1parts: number[] | string[] = v1.split('.');
    let v2parts: number[] | string[] = v2.split('.');

    function isValidPart(x: string) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

interface AppInfo {
    git: string;
    summary?: string;
    author?: string;
    repoAuthor?: string;
    name: string;
    description: string;
    categories?: string[];
    anti_features?: string[];
    ReleaseDescription?: string;
    License?: string;
    keyName?: string;

    defaultBranchName: string;
    fileList?: string[];
}

const octokit = new Octokit({
    auth: process.env.GH_ACCESS_TOKEN,
    userAgent: 'auto-daily-fdroid/1.0',
});

// ./metascoop -ap=../apps.yaml -rd=../fdroid/repo -pat="$GH_ACCESS_TOKEN" $1

const appsYmlPath = '../apps.yaml';
const repoDirectory = '../fdroid/repo';

interface Repo {
    author: string;
    name: string;
    host: string;
}

function getRepoInfo(repoURL: string): Repo {
    const u = new URL(repoURL);

    const [author, name] = u.pathname.replace(/^\/*/, '').replace(/\/*$/, '').split('/')
    const host = u.host.replace('/^www\./', '');

    return {author, name, host};
}

async function listAllReleases(appRepoAuthor: string, appRepoName: string) {
    //rels, _, ierr := githubClient.Repositories.ListReleases(context.Background(), appRepoAuthor, appRepoName, &github.ListOptions{
    //	Page:    1,
    //	PerPage: 2,
    //})
    //if ierr != nil || len(rels) == 0 {
    //	err = ierr
    //	return
    //}
    //
    //allReleases = append(allReleases, rels...)

    let currentPage = 1;

    let releases: components['schemas']['release'][] = [];

    while (true) {
        let results: components['schemas']['release'][];
        try {
            results = ((await octokit.rest.repos.listReleases({
                owner: appRepoAuthor,
                repo: appRepoName,
                page: currentPage,
                per_page: 100
            })).data);
        } catch (err) {
            //break;
            throw err;
        }

        if (results.length === 0) break;

        releases.push(...results);

        currentPage++;
    }

    return releases;
}

function findApkRelease(release: Release): ReleaseAsset[] {
    const assets = release.releaseAssets.nodes.filter(e => e.contentType == 'application/vnd.android.package-archive');

    const anyHasArchSpecific = assets.some(e => /arm64|armeabi|x86|x86_64/i.test(e.name));
    const universal = assets.find(e => !/arm64|armeabi|x86|x86_64/i.test(e.name));

    if (anyHasArchSpecific) {
        const archs = 'arm64|armeabi|x86|x86_64'.split('|');
        const importanArchs = 'arm64|armeabi'.split('|');

        const byArch = Object.fromEntries(assets
            .filter(e => /arm64-v8a|armeabi|x86|x86_64/i.test(e.name))
            .map(e => [archs.find(arch => e.name.includes(arch)), e]));

        if (importanArchs.every(e => Object.keys(byArch).find(e1 => e1.includes(e)))) {
            return Object.values(byArch);
        }
    }
    if (universal) return [universal];

    // arm64-v8a	74b89a06f10af4d510d322ed80f4dc160d729ce0e16274f532dd0baa42428ae8
    // armeabi-v7a	004758c72f628a619c4f6d950b40a906ec6b7e9c7a708caf19bd791b34063fc5
    // x86	f42eec3ed9a836e1590ddc98badddd4e273f1260994d8b2d2dd4fe5117821064
    // x86_64	f82bafd30cdd4922c6e2e08c5d30ba33e85bb8e47865dca45449d6cefcabe2bd

    return assets.length > 0 ? [assets[0]] : [];
}

function group(name: string): Disposable {
    startGroup(name);
    return {
        [Symbol.dispose]() {
            endGroup();
        }
    };
}

function generateReleaseFilename(appName: string, tagName: string, asset: ReleaseAsset): string {
	let normalName = `${appName}_${tagName}.apk`;

    const archs = 'arm64|armeabi|x86|x86_64'.split('|');
    const foundArch = archs.find(arch => normalName.includes(arch));
    if (foundArch) {
        normalName = `${appName}_${tagName}_${foundArch}.apk`
    }

	//var tc = transform.Chain(norm.NFD, runes.Remove(runes.Predicate(func(r rune) bool {
	//	return unicode.Is(unicode.Mn, r)
	//})), norm.NFC)

	//cleaned, _, err := transform.String(tc, normalName)
	//if err != nil {
	//	cleaned = normalName
	//}

    return normalName.replace(/[^a-zA-Z0-9_\-\.\ ]/g, '');
}

async function readIndex(path: string) {
	return await fsxt.readJson(path) as IndexV1;
}

async function readMetaFile(path: string) {
    return loadYaml(await fsxt.readText(path)) as FDroidDataMetadata2;
}

function findLatestPackage(repo: IndexV1, pkgName: string) {
    if (!(pkgName in repo.packages)) {
        return undefined;
    }

    const pkgs = repo.packages[pkgName];

    pkgs.slice().sort((a, b) => {
        if (a.versionCode != b.versionCode) {
            return a.versionCode - b.versionCode;
        }

        try {
            return compare(a.versionName, b.versionName, { loose: true });
        } catch (err) {
            try {
                return versionCompare(a.versionName, b.versionName);
            } catch (err2) {
                return a.versionName > b.versionName ? 1 : a.versionName == b.versionName ? -1 : 0;
            }
        }
    });

	// Return the one with the latest version
	return pkgs[pkgs.length-1];
}

async function writeMetaFile(path: string, data: FDroidDataMetadata2) {
	await fsxt.writeFile(path, dumpYaml(data));
}

const
	tableStart = "<!-- This table is auto-generated. Do not edit -->",

	tableEnd = "<!-- end apps table -->",

	tableTmpl = `
| Icon | Name | Description | Version |
| --- | --- | --- | --- |{{#each apps}}
| <a href="{{sourceCode}}"><img src="fdroid/repo/icons/{{icon}}" alt="{{name}} icon" width="36px" height="36px"></a> | [**{{name}}**]({{sourceCode}}) | {{summary}} | {{suggestedVersionName}} ({{suggestedVersionCode}}) |{{/each}}
` + tableEnd;

var tmpl = Handlebars.compile(tableTmpl);

async function regenerateReadme(readMePath: string, index: IndexV1) {
	const content = await fsxt.readFile(readMePath, 'utf-8');

    const tableStartIndex = content.indexOf(tableStart);
	if (tableStartIndex < 0) {
		throw new Error(`cannot find table start in ${readMePath}`);
	}

	const tableEndIndex = content.indexOf(tableEnd);
	if (tableEndIndex < 0) {
		throw new Error(`cannot find table end in ${readMePath}`);
	}

	const result = tmpl(index);

	let newContent = '';

	newContent += content.slice(0, tableStartIndex + tableStart.length);
	newContent += result;
	newContent += content.slice(tableEndIndex + tableEnd.length);

	return await fsxt.writeFile(readMePath, newContent);
}

(async () => {
    startGroup('Initializing');
    const appsList = loadYaml(await fsxt.readText(appsYmlPath)) as Record<string, AppInfo>;
    for (const [key, app] of Object.entries(appsList)) {
        app.keyName = key;
    }

    const appsListArray = Object.values(appsList);

    const fdroidIndexFilePath = path.join(repoDirectory, 'index-v1.json');

    await fsxt.mkdirs(repoDirectory);

    endGroup();

    const apkInfoMap: Record<string, AppInfo> = {};

    const grapqlResult = await doQueries(appsListArray);

    await fsxt.writeJson('../test.json', grapqlResult, {spaces: 4});

    console.log(grapqlResult);

    let haveError = false;
    for (const [appidx, githubRepo] of Object.entries(grapqlResult.data)) {

        const app = appsListArray[Number(appidx.slice('res_'.length))];
        console.log(`App: ${app.name} by ${app.author ?? '???'}`);

        let repo: Repo;

        try {
            repo = getRepoInfo(app.git);
        } catch (err) {
            console.error(`Error while getting repo info from URL ${app.git}`, err)
            haveError = true;
            return;
        }

        console.log(`Looking up ${repo.author}/${repo.name} on GitHub`);

        app.summary = githubRepo.description ?? '[No description]';

        if (githubRepo.licenseInfo?.spdxId != null) {
            app.License = githubRepo.licenseInfo.spdxId;
        }

        console.log("Data from GitHub: summary=" + app.summary + ", license=" + app.License);

        const releases = githubRepo.releases.nodes;

        console.log(`Received ${releases.length} releases`);

        let foundApks = 0;
        const apksThreshold = 3;

        top:
        for (const release of releases) {
            if (foundApks >= apksThreshold) {
                console.log(`Got ${apksThreshold} releases, but there are still ${releases.length - (releases.indexOf(release))} more`);
                break;
            }

            using _ = group(`Release ${release.tagName}`);

            if (release.isPrerelease) {
                console.log(`Skipping prerelease ${release.tagName}`);
            }

            if (release.isDraft) {
                console.log(`Skipping draft ${release.tagName}`);
            }

            if (release.tagName == '') {
                console.log(`Skipping release with empty tag name`);
            }

            console.log(`Working on release with tag name ${release.tagName}`);

            const apks = findApkRelease(release);
            if (apks.length == 0) {
                console.log("Couldn't find a release asset with extension \".apk\"");
                continue; // return;
            }

            const appNames = apks.map((e, i) => [i, generateReleaseFilename(app.name, release.tagName, e)] as const);

            console.log(`Target APK names: ${appNames.join(', ')}`);

            const appClone = Object.assign({}, app);
            appClone.ReleaseDescription = release.description;
            if (appClone.ReleaseDescription != '') {
                console.log(`Release notes: ${appClone.ReleaseDescription}`);
            }

            for (const [i, appName] of appNames) {
                apkInfoMap[appName] = appClone;

                const appTargetPath = path.join(repoDirectory, appName);

                // If the app file already exists for this version, we continue
                if (await fsxt.exists(appTargetPath)) {
                    console.log(`Already have APK for version ${release.tagName} at ${appTargetPath}`);
                    foundApks++;
                    continue top;
                }

                console.log(`Downloading APK ${apks[i].name} from release ${release.tagName} to ${appTargetPath}`);

                // TODO timeout

                const buf = await fetch(apks[i].downloadUrl, {
                    headers: {
                        Authorization: `Bearer ${process.env.GH_ACCESS_TOKEN}`,
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }).then(e => e.arrayBuffer());

                await fsxt.writeFile(appTargetPath, new DataView(buf));

                console.log(`Successfully downloaded app for version ${release.tagName} APK ${apks[i].name}`)
            }
            foundApks++;
        }

        if (foundApks === 0) {
            console.log("Couldn't find any release assets with extension \".apk\"");
            return;
        }

        /*
                log.Printf("Downloading APK %q from release %q to %q", apk.GetName(), release.GetTagName(), appTargetPath)

                dlCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
                defer cancel()

                appStream, _, err := githubClient.Repositories.DownloadReleaseAsset(dlCtx, repo.Author, repo.Name, apk.GetID(), http.DefaultClient)
                if err != nil {
                    log.Printf("Error while downloading app %q (artifact id %d) from from release %q: %s", app.GitURL, apk.GetID(), release.GetTagName(), err.Error())
                    haveError = true
                    return
                }

                err = downloadStream(appTargetPath, appStream)
                if err != nil {
                    log.Printf("Error while downloading app %q (artifact id %d) from from release %q to %q: %s", app.GitURL, *apk.ID, *release.TagName, appTargetPath, err.Error())
                    haveError = true
                    return
                }

                log.Printf("Successfully downloaded app for version %q", release.GetTagName())
            }()
        } */

        app.defaultBranchName = githubRepo.defaultBranchRef.name;
        app.fileList = flattenFiles(githubRepo.files);
    }

    const debugMode = false;

	if (!debugMode) {
        using _ = group('F-Droid: Creating metadata stubs')
		// Now, we run the fdroid update command

		console.log(`Running "fdroid update --pretty --create-metadata --delete-unknown" in ${path.dirname(repoDirectory)}`);

        const code = await exec('fdroid', ['update', '--pretty', '--create-metadata', '--delete-unknown'], {
            cwd: path.dirname(repoDirectory)
        });

		if (code != 0) {
			error("Error while running \"fdroid update -c\":" + code)
            process.exit(1);
		}
	}

    const toRemovePaths: string[] = [];

    {
        using _ = group('Filling in metadata');
        // FDroidDataMetadata
        const fdroidIndex = await readIndex(fdroidIndexFilePath);

        const walkPath = path.join(repoDirectory, '..', 'metadata');
        await fsxt.dive(walkPath, { recursive: true, directories: false, files: true, all: true }, async (file, stat) => {
            if (path.extname(file) != '.yml') {
                return;
            }

            let pkgname = path.basename(file, '.yml');

            using _ = group(pkgname);

            console.log(`Working on ${pkgname}`);

            const meta = await readMetaFile(file) ?? {};

			const latestPackage = findLatestPackage(fdroidIndex, pkgname);
            if (!latestPackage) {
                console.error('no package :(', pkgname);
                return;
            }

            console.log(`The latest version is ${latestPackage.versionName} with versionCode ${latestPackage.versionCode}`);

			const apkInfo = apkInfoMap[latestPackage.apkName];
			if (!apkInfo) {
				console.error(`Cannot find apk info for ${latestPackage.apkName}`);
				return;
			}

            console.log(apkInfo);

			// Now update with some info

            function setNonEmpty<K extends string>(m: { [key in K]?: string }, key: K, value?: string) {
                if (value || m[key] == "Unknown") {
                    m[key] = value;

                    console.log(`Set ${key} to ${value}`);
                }
            }

			setNonEmpty(meta, "AuthorName", apkInfo.author);
			setNonEmpty(meta, "Name", apkInfo.name ?? apkInfo.keyName);
			setNonEmpty(meta, "SourceCode", apkInfo.git);
			setNonEmpty(meta, "License", apkInfo.License);
			setNonEmpty(meta, "Description", apkInfo.description);

			var summary = apkInfo.summary ?? apkInfo.description;
			// See https://f-droid.org/en/docs/Build_Metadata_Reference/#Summary for max length
			const maxSummaryLength = 80
			if (summary && summary.length > maxSummaryLength) {
				summary = summary.slice(0, -3) + '...'

				console.log(`Truncated summary to length of ${summary.length} (max length)`);
			}

			setNonEmpty(meta, "Summary", summary);

			if (apkInfo.categories && apkInfo.categories.length > 0) {
				meta["Categories"] = apkInfo.categories as typeof meta["Categories"];
			}

			if (apkInfo.anti_features && apkInfo.anti_features.length > 0) {
				meta["AntiFeatures"] = apkInfo.anti_features as typeof meta["AntiFeatures"]; //.join(',');
			}

			meta["CurrentVersion"] = latestPackage.versionName;
			meta["CurrentVersionCode"] = latestPackage.versionCode;

			console.log("Set current version info to versionName=%q, versionCode=%d", latestPackage.versionName, latestPackage.versionCode)

            try {
			    await writeMetaFile(file, meta);
            } catch (err) {
				console.error(`Writing meta file ${file}:`, err);
                return;
            }

			console.log(`Updated metadata file ${file}`);

			if (apkInfo.ReleaseDescription != "") {
				const destFilePath = path.join(walkPath, latestPackage.packageName, "en-US", "changelogs", `${latestPackage.versionCode}d.txt`);

                try {
                    await fsxt.mkdirp(path.dirname(destFilePath));
                } catch (err) {
                    console.error(`Creating directory for changelog file ${destFilePath}:`, err);
                    return;
                }

                try {
                    await fsxt.writeFile(destFilePath, apkInfo.ReleaseDescription ?? '');
                } catch (err) {
                    console.error(`Writing changelog file ${destFilePath}:`, err);
                    return;
                }

				console.log(`Wrote release notes to ${destFilePath}`);
			}

			console.log("Cloning git repository to search for screenshots")

            // TODO
			//gitRepoPath, err := git.CloneRepo(apkInfo.git)
			//if err != nil {
			//	log.Printf("Cloning git repo from %q: %s", apkInfo.GitURL, err.Error())
			//	return nil
			//}
			//defer os.RemoveAll(gitRepoPath)
            //
			//metadata, err := apps.FindMetadata(gitRepoPath)
			//if err != nil {
			//	log.Printf("finding metadata in git repo %q: %s", gitRepoPath, err.Error())
			//	return nil
			//}
            //
			//log.Printf("Found %d screenshots", len(metadata.Screenshots))

			const screenshotsPath = path.join(walkPath, latestPackage.packageName, "en-US", "phoneScreenshots")

			await fsxt.rm(screenshotsPath, { recursive: true, force: true });

            await fsxt.mkdirp(screenshotsPath);

            const screenshots = apkInfo.fileList?.filter(e => e.includes('screenshot') && (e.endsWith("png") || e.endsWith("jpg") || e.endsWith("jpeg"))) ?? [];

            let sccounter = 1;
            for (const screenshot of screenshots) {
                const url = `${apkInfo.git.replace('github.com', 'raw.githubusercontent.com')}/${apkInfo.defaultBranchName}${screenshot}`;

                console.log('Downloading and saving screenshot from', url);

                await fsxt.writeFile(path.join(screenshotsPath, '' + (sccounter++) + path.extname(screenshot)), new DataView(await fetch(url).then(e => e.arrayBuffer())));
            }

            toRemovePaths.push(screenshotsPath);
        });
    }

	if (!debugMode) {
        using _ = group('F-Droid: Reading updated metadata')
		// Now, we run the fdroid update command

		console.log(`Running "fdroid update --pretty --delete-unknown" in ${path.dirname(repoDirectory)}`);

        const code = await exec('fdroid', ['update', '--pretty', '--delete-unknown'], {
            cwd: path.dirname(repoDirectory)
        });

		if (code != 0) {
			error("Error while running \"fdroid update --pretty', '--delete-unknown\":" + code)
            process.exit(1);
		}
	}

    {
        using _ = group('Assessing changes');

	    // Now at the end, we read the index again
        const fdroidIndex = await readIndex(fdroidIndexFilePath);

        // Now we can remove all paths that were marked for doing so

        for (const path of toRemovePaths) {
            await fsxt.rm(path, { force: true, recursive: true });
        }

        // We can now generate the README file
        const readmePath = path.join(path.dirname(path.dirname(repoDirectory)), "README.md")

        await regenerateReadme(readmePath, fdroidIndex);
    }


	//if haveOldIndex {
	//		cpath, haveSignificantChanges := apps.HasSignificantChanges(initialFdroidIndex, fdroidIndex)
	//		if haveSignificantChanges {
	//log.Printf("The index %q had a significant change at JSON path %q", fdroidIndexFilePath, cpath)
	//		} else {
	//log.Printf("The index files didn't change significantly")

	//changedFiles, err := git.GetChangedFileNames(*repoDir)
	//if err != nil {
	//log.Fatalf("getting changed files: %s\n::endgroup::\n", err.Error())
	//}

	//// If only the index files changed, we ignore the commit
	//for _, fname := range changedFiles {
	//if !strings.Contains(fname, "index") {
	//haveSignificantChanges = true

	//log.Printf("File %q is a significant change", fname)
	//}
	//}

	//if !haveSignificantChanges {
	//log.Printf("It doesn't look like there were any relevant changes, neither to the index file nor any file indexed by git.")
	//}
	//		}
	//} else {
	//		log.Printf("The index files didn't change significantly")

	//		changedFiles, err := git.GetChangedFileNames(*repoDir)
	//		if err != nil {
	//log.Fatalf("getting changed files: %s\n::endgroup::\n", err.Error())
	//		}

	//		// If only the index files changed, we ignore the commit
	//		for _, fname := range changedFiles {
	//if !strings.Contains(fname, "index") {
	//haveSignificantChanges = true

	//log.Printf("File %q is a significant change", fname)
	//}
	//		}

	//		if !haveSignificantChanges {
	//log.Printf("It doesn't look like there were any relevant changes, neither to the index file nor any file indexed by git.")
	//		}
	//}

	//fmt.Println("::endgroup::")

	//// If we have an error, we report it as such
	//if haveError {
    //  os.Exit(1)
	//}

	//// If we don't have any good changes, we report it with exit code 2
	//if !haveSignificantChanges {
	//	os.Exit(2)
	//}

	// If we have relevant changes, we exit with code 0
})();

function flattenFiles(files: Files): string[] {
    function* flattenFilesInner(entries: Entry[], basePath: string = ''): Generator<string> {
        for (const entry of entries) {
            if (entry.t == 'blob') {
                yield `${basePath}/${entry.n}`;
            } else if (entry.t == 'tree') {
                if (entry.o.e) {
                    yield* flattenFilesInner(entry.o.e, `${basePath}/${entry.n}`);
                } else {
                    // empty folder :)
                    // console.error(`No entries for ${entry.t} ${basePath}/${entry.n}`)
                }
            } else {
                // t=commit for submodules
            }
        }
    }

    return [...flattenFilesInner(files.e)];
}

async function doQueries(appsListArray: AppInfo[]) {
    const splitGitRe = /^https:\/\/github\.com\/(.*?)\/(.*?)$/i

    const result: GraphqlResult = { data: { } };

    const sliceSize = 8;

    for (let i = 0; i < appsListArray.length; i += sliceSize) {
        const slice = appsListArray.slice(i, Math.min(i + sliceSize, appsListArray.length));

        const queried = await octokit.graphql<GraphqlResult['data']>(`
            query {
                ${slice.map((app, j) => {
                    const split = app.git.match(splitGitRe);
                    if (split === null) throw new Error('No split!! ' + app.git);
                    return `res_${i+j}: repository(owner:${JSON.stringify(split[1])}, name:${JSON.stringify(split[2])}, followRenames: true) { ...doProcessing }`
                }).join('\n')}
            }

            fragment doProcessing on Repository {
                defaultBranchRef {
                    name
                },
                files:object(expression: "HEAD:") {
                    # Top-level.
                    ... on Tree {
                        e:entries {
                            n:name
                            t:type
                            o:object {
                                ... on Blob {
                                    b:byteSize
                                }

                                # One level down.
                                ... on Tree {
                                    e:entries {
                                        n:name
                                        t:type
                                        o:object {

                                        # Two levels down.
                                        ... on Tree {
                                                e:entries {
                                                n:name
                                                t:type
                                                o:object {

                                                    # Three levels down.
                                                    ... on Tree {
                                                        e:entries {
                                                            n:name
                                                            t:type
                                                            o:object {
                                                                ... on Blob {
                                                                    b:byteSize
                                                                }
                                                            }
                                                        }
                                                    }
                                                    ... on Blob {
                                                        b:byteSize
                                                    }

                                                }
                                            }
                                        }
                                        ... on Blob {
                                            b:byteSize
                                        }

                                        }
                                    }
                                }
                                ... on Blob {
                                    b:byteSize
                                }
                            }
                        }
                    }
                }

                description
                licenseInfo {
                    spdxId
                }
                releases(first:100) {
                    nodes {
                        isPrerelease
                        isDraft
                        tagName
                        description
                        releaseAssets(first: 100) {
                            nodes {
                                id
                                name
                                downloadUrl
                                contentType
                            }
                        }
                    }
                }
            }
        `);

        console.log(queried);

        Object.assign(result.data, queried);
    }

    return result;
}

