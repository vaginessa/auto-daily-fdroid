export interface GraphqlResult {
    data: Data;
}

export interface Data {
    [key: string]: Repository;
}

export interface Repository {
    files:       Files;
    description: string;
    licenseInfo: LicenseInfo;
    releases:    Releases;
}

export interface Files {
    e: Entry[];
}

export interface Entry {
    /** Name */
    n: string;
    /** Type */
    t: Type;
    /** Object */
    o: Object;
}

export interface Object {
    /** ByteSize */
    b?: number;
    /** Entries */
    e?: Entry[];
}

export enum Type {
    Blob = "blob",
    Tree = "tree",
}

export interface LicenseInfo {
    spdxId: string;
}

export interface Releases {
    nodes: ReleasesNode[];
}

export interface ReleasesNode {
    isPrerelease:  boolean;
    isDraft:       boolean;
    tagName:       string;
    description:   string;
    releaseAssets: ReleaseAssets;
}

export interface ReleaseAssets {
    nodes: ReleaseAssetsNode[];
}

export interface ReleaseAssetsNode {
    id:          string;
    name:        string;
    downloadUrl: string;
    contentType: ContentType;
}

export enum ContentType {
    ApplicationVndAndroidPackageArchive = "application/vnd.android.package-archive",
}
