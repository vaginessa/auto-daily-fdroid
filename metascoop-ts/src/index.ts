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
import { GraphqlResult } from "./graphql";

interface AppInfo {
    git: string;
    summary: string;
    author: string;
    repoAuthor?: string;
    name: string;
    description: string;
    categories: string[];
    anti_features: string[];
    ReleaseDescription?: string;
    License?: string;
    keyName?: string;


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

        return compare(a.versionName, b.versionName);
    });

	// Return the one with the latest version
	return pkgs[pkgs.length-1];
}

async function writeMetaFile(path: string, data: FDroidDataMetadata2) {
	await fsxt.writeFile(path, dumpYaml(data));
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

    const grapqlResult = await octokit.graphql<GraphqlResult>(`
        query {
            ${appsListArray.map((app, i) => `res_${i}: repository(owner:${JSON.stringify(app.author)}, name:${JSON.stringify(app.name)}, followRenames: true) { ...doProcessing }`).join('\n')}
        }

        fragment doProcessing on Repository {
            description
            licenseInfo {
              spdxId
            }
            releases(first: 100) {
                nodes {
                    isPrerelease
                    isDraft
                    tagName
                    description
                    releaseAssets(first: 100) {
                        nodes {
                            name
                            downloadUrl
                            contentType
                        }
                    }
                }
            }
        }
    `)

    let haveError = false;
    for (const [appidx, githubRepo] of Object.entries(grapqlResult.data)) {
        const app = appsListArray[Number(appidx.slice('res_'.length))];
        console.log(`App: ${app.author}/${app.name}`);

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

        top:
        for (const release of releases) {
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
                return;
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
                    continue top;
                }

                console.log(`Downloading APK ${apks[i].name} from release ${release.tagName} to ${appTargetPath}`);

                // TODO timeout

                const buf = await fetch(apks[i].downloadURL, {
                    headers: {
                        Authorization: `Bearer ${process.env.GH_ACCESS_TOKEN}`,
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }).then(e => e.arrayBuffer());

                await fsxt.writeFile(appTargetPath, new DataView(buf));

                console.log(`Successfully downloaded app for version ${release.tagName} APK ${apks[i].name}`)
            }
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

        app.fileList
        githubRepo.files.e
    }

    const debugMode = false;

	if (!debugMode) {
        using _ = group('F-Droid: Creating metadata stubs')
		// Now, we run the fdroid update command

		console.log(`Running "fdroid update --pretty --create-metadata --delete-unknown" in ${repoDirectory}`);

        const code = await exec('fdroid', ['update', '--pretty', '--create-metadata', '--delete-unknown'], {
            cwd: repoDirectory
        });

		if (code != 0) {
			error("Error while running \"fdroid update -c\":", code)
            process.exit(1);
		}
	}

    {
        using _ = group('Filling in metadata');
        // FDroidDataMetadata
        const fdroidIndex = await readIndex(fdroidIndexFilePath);

        const toRemovePaths: string[] = [];

        const walkPath = path.join(repoDirectory, 'metadata');
        await fsxt.dive(walkPath, { recursive: true, directories: false, files: true, all: true }, async (file, stat) => {
            if (!file.endsWith('.yml')) {
                return;
            }

            const pkgname = file.replace(/.yml$/i, '');

            using _ = group(pkgname);

            console.log(`Working on ${pkgname}`);

            const meta = await readMetaFile(file);

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

			// Now update with some info

            function setNonEmpty<K extends string>(m: { [key in K]?: string }, key: K, value: string) {
                if (value || m[key] == "Unknown") {
                    m[key] = value;

                    console.log(`Set ${key} to ${value}`);
                }
            }

			setNonEmpty(meta, "AuthorName", apkInfo.author);
			setNonEmpty(meta, "Name", apkInfo.name ?? apkInfo.keyName!);
			setNonEmpty(meta, "SourceCode", apkInfo.git);
			setNonEmpty(meta, "License", apkInfo.License!);
			setNonEmpty(meta, "Description", apkInfo.description!);

			var summary = apkInfo.summary;
			// See https://f-droid.org/en/docs/Build_Metadata_Reference/#Summary for max length
			const maxSummaryLength = 80
			if (summary.length > maxSummaryLength) {
				summary = summary.slice(0, -3) + '...'

				console.log(`Truncated summary to length of ${summary.length} (max length)`);
			}

			setNonEmpty(meta, "Summary", summary);

			if (apkInfo.categories.length > 0) {
				meta["Categories"] = apkInfo.categories as typeof meta["Categories"];
			}

			if (apkInfo.anti_features.length > 0) {
				meta["AntiFeatures"] = apkInfo.anti_features as typeof meta["AntiFeatures"]; //.join(',');
			}

			meta["CurrentVersion"] = latestPackage.versionName;
			meta["CurrentVersionCode"] = latestPackage.versionCode;

			console.log("Set current version info to versionName=%q, versionCode=%d", latestPackage.versionName, latestPackage.versionCode)

            try {
			    await writeMetaFile(file, meta);
            } catch (err) {
				console.error(`Writing meta file ${path}:`, err);
                return;
            }

			console.log(`Updated metadata file ${path}`);

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

			screenshotsPath := filepath.Join(walkPath, latestPackage.PackageName, "en-US", "phoneScreenshots")

			_ = os.RemoveAll(screenshotsPath)

			var sccounter int = 1
			for _, sc := range metadata.Screenshots {
				var ext = filepath.Ext(sc)
				if ext == "" {
					log.Printf("Invalid: screenshot file extension is empty for %q", sc)
					continue
				}

				var newFilePath = filepath.Join(screenshotsPath, fmt.Sprintf("%d%s", sccounter, ext))

				err = os.MkdirAll(filepath.Dir(newFilePath), os.ModePerm)
				if err != nil {
					log.Printf("Creating directory for screenshot file %q: %s", newFilePath, err.Error())
					return nil
				}

				err = file.Move(sc, newFilePath)
				if err != nil {
					log.Printf("Moving screenshot file %q to %q: %s", sc, newFilePath, err.Error())
					return nil
				}

				log.Printf("Wrote screenshot to %s", newFilePath)

				sccounter++
			}

			toRemovePaths = append(toRemovePaths, screenshotsPath)

			return nil
        });
    }

    /*
		}()
	})
	if err != nil {
		log.Printf("Error while walking metadata: %s", err.Error())

		os.Exit(1)
	}

	if !*debugMode {
		fmt.Println("::group::F-Droid: Reading updated metadata")

		// Now, we run the fdroid update command again to regenerate the index with our new metadata
		cmd := exec.Command("fdroid", "update", "--pretty", "--delete-unknown")
		cmd.Stderr = os.Stderr
		cmd.Stdout = os.Stdout
		cmd.Stdin = os.Stdin
		cmd.Dir = filepath.Dir(*repoDir)

		log.Printf("Running %q in %s", cmd.String(), cmd.Dir)

		err = cmd.Run()
		if err != nil {
			log.Println("Error while running \"fdroid update -c\":", err.Error())

			fmt.Println("::endgroup::")
			os.Exit(1)
		}
		fmt.Println("::endgroup::")
	}

	fmt.Println("::group::Assessing changes")

	// Now at the end, we read the index again
	fdroidIndex, err = apps.ReadIndex(fdroidIndexFilePath)
	if err != nil {
		log.Fatalf("reading f-droid repo index: %s\n::endgroup::\n", err.Error())
	}

	// Now we can remove all paths that were marked for doing so

	for _, rmpath := range toRemovePaths {
		err = os.RemoveAll(rmpath)
		if err != nil {
			log.Fatalf("removing path %q: %s\n", rmpath, err.Error())
		}
	}

	// We can now generate the README file
	readmePath := filepath.Join(filepath.Dir(filepath.Dir(*repoDir)), "README.md")
	err = md.RegenerateReadme(readmePath, fdroidIndex)
	if err != nil {
		log.Fatalf("error generating %q: %s\n", readmePath, err.Error())
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

	fmt.Println("::endgroup::")

	// If we have an error, we report it as such
	if haveError {
		os.Exit(1)
	}

	//// If we don't have any good changes, we report it with exit code 2
	//if !haveSignificantChanges {
	//	os.Exit(2)
	//}

	// If we have relevant changes, we exit with code 0 */
})();
