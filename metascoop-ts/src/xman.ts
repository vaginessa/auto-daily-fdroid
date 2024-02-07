import path from "path";
import { versionCompare } from "./utils";
import * as fsxt from 'fsxt';

export interface XManagerData {
    Stock_Patched_Latest: string;
    Amoled_Patched_Latest: string;
    SCP_Latest: string;
    ACP_Latest: string;
    SE_Patched_Latest: string;
    AE_Patched_Latest: string;
    SECP_Latest: string;
    AECP_Latest: string;
    Lite_Patched_Latest: string;
    Wave_Patched_Latest: string;
    App_Changelogs: string;
    Supporters: string;
    Rewarded_Ads: string;
    Update: string;
    Telegram: string;
    Reddit: string;
    Donate: string;
    Discord: string;
    Source: string;
    Website: string;
    FAQ: string;
    Server: string;
    Stock_Patched: Patched[];
    Amoled_Patched: Patched[];
    Stock_Cloned_Patched: Patched[];
    Amoled_Cloned_Patched: Patched[];
    Stock_Experimental_Patched: Patched[];
    Amoled_Experimental_Patched: Patched[];
    Stock_Experimental_Cloned_Patched: Patched[];
    Amoled_Experimental_Cloned_Patched: Patched[];
    Lite_Patched: Patched[];
    Wave_Patched: Patched[];
    Patched_Changelogs: PatchedChangelog[];
}

export interface Patched {
    Title: string;
    Link_1: string;
    Link_2: string;
    Mirror: string;
}

export interface PatchedChangelog {
    Patched_Changelogs: string;
}

function versionCompare2(a: string, b: string) {
    try {
        return versionCompare(a, b);
    } catch (err2) {
        return a > b ? 1 : a == b ? -1 : 0;
    }
}

(async () => {
    const xmanagerData: XManagerData = await fetch('https://gist.githubusercontent.com/xC3FFF0E/5268182b9bc89832a9cfbe2eb0568c3c/raw')
        .then(e => e.json());

    const repoDirectory = '../fdroid/repo';

    const init: RequestInit = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0' } };

    for (const app of xmanagerData.Stock_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Spotify_Patched_Stock-${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Amoled_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Spotify_Patched_Amoled-${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Stock_Cloned_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Stock_Cloned_Patched_${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Amoled_Cloned_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Amoled_Cloned_Patched_${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Stock_Experimental_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Spotify_Patched_Experimental-${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Amoled_Experimental_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Spotify_Patched_Experimental-Amoled-${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Stock_Experimental_Cloned_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Stock_Experimental_Cloned_Patched_${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Amoled_Experimental_Cloned_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Amoled_Experimental_Cloned_Patched_${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Lite_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Lite_Patched_${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }

    for (const app of xmanagerData.Wave_Patched.reverse().splice(0, 1)) {
        const file = path.join(repoDirectory, `xManager_Wave_Patched_${app.Title}.apk`);
        if (!await fsxt.exists(file)) {
            await fsxt.writeFile(
                file,
                new DataView(await fetch(app.Link_1, init).then(e => e.arrayBuffer()))
            );
        }
    }
})();