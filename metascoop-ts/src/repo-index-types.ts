export interface IndexV1 {
    repo:     Repo;
    requests: Requests;
    apps:     App[];
    packages: { [key: string]: Package[] };
}

export interface App {
    categories:             Category[];
    changelog?:             string;
    suggestedVersionName:   string;
    suggestedVersionCode:   string;
    issueTracker?:          string;
    license:                License;
    sourceCode?:            string;
    webSite?:               string;
    added:                  number;
    icon?:                  string;
    packageName:            string;
    lastUpdated:            number;
    localized?:             Localized;
    description?:           string;
    authorEmail?:           string;
    authorName?:            string;
    authorWebSite?:         string;
    donate?:                string;
    liberapay?:             string;
    antiFeatures?:          AntiFeature[];
    translation?:           string;
    bitcoin?:               string;
    litecoin?:              string;
    flattrID?:              string;
    name?:                  string;
    allowedAPKSigningKeys?: string[];
    binaries?:              string;
    openCollective?:        string;
    authorPhone?:           string;
}

export enum AntiFeature {
    Ads = "Ads",
    KnownVuln = "KnownVuln",
    NoSourceSince = "NoSourceSince",
    NonFreeAdd = "NonFreeAdd",
    NonFreeAssets = "NonFreeAssets",
    NonFreeDep = "NonFreeDep",
    NonFreeNet = "NonFreeNet",
    Nsfw = "NSFW",
    Tracking = "Tracking",
    UpstreamNonFree = "UpstreamNonFree",
}

export enum Category {
    Connectivity = "Connectivity",
    Development = "Development",
    Games = "Games",
    Graphics = "Graphics",
    Internet = "Internet",
    Money = "Money",
    Multimedia = "Multimedia",
    Navigation = "Navigation",
    PhoneSMS = "Phone & SMS",
    Reading = "Reading",
    ScienceEducation = "Science & Education",
    Security = "Security",
    SportsHealth = "Sports & Health",
    System = "System",
    Theming = "Theming",
    Time = "Time",
    Writing = "Writing",
}

export enum License {
    AAL = "AAL",
    AGPL30Only = "AGPL-3.0-only",
    AGPL30OrLater = "AGPL-3.0-or-later",
    Afl11 = "AFL-1.1",
    Apache20 = "Apache-2.0",
    Artistic20 = "Artistic-2.0",
    BSD2Clause = "BSD-2-Clause",
    BSD3Clause = "BSD-3-Clause",
    BSD4Clause = "BSD-4-Clause",
    Cc010 = "CC0-1.0",
    CcBy40 = "CC-BY-4.0",
    CcBySa40 = "CC-BY-SA-4.0",
    Cddl10 = "CDDL-1.0",
    Cecill21 = "CECILL-2.1",
    Cpal10 = "CPAL-1.0",
    Epl10 = "EPL-1.0",
    Epl20 = "EPL-2.0",
    Eupl11 = "EUPL-1.1",
    Eupl12 = "EUPL-1.2",
    Fair = "Fair",
    GPL20Only = "GPL-2.0-only",
    GPL20OrLater = "GPL-2.0-or-later",
    GPL30Only = "GPL-3.0-only",
    GPL30OrLater = "GPL-3.0-or-later",
    ISC = "ISC",
    LGPL21Only = "LGPL-2.1-only",
    LGPL21OrLater = "LGPL-2.1-or-later",
    LGPL30Only = "LGPL-3.0-only",
    LGPL30OrLater = "LGPL-3.0-or-later",
    MIT = "MIT",
    MPL20 = "MPL-2.0",
    MirOS = "MirOS",
    NCSA = "NCSA",
    Nposl30 = "NPOSL-3.0",
    PublicDomain = "PublicDomain",
    The0BSD = "0BSD",
    Unlicense = "Unlicense",
    Wtfpl = "WTFPL",
    X11 = "X11",
    Zlib = "Zlib",
}

export interface Localized {
    "en-US"?:              AF;
    "es-ES"?:              AF;
    "fr-FR"?:              AF;
    "tr-TR"?:              Am;
    cs?:                   AFZa;
    de?:                   AFZa;
    eo?:                   AF;
    et?:                   AF;
    fr?:                   AF;
    he?:                   AFZa;
    pl?:                   AF;
    pt?:                   Am;
    "pt-BR"?:              Am;
    "pt-PT"?:              Am;
    ro?:                   Am;
    ru?:                   Am;
    sw?:                   Am;
    tr?:                   Am;
    uk?:                   Am;
    vi?:                   Am;
    "zh-CN"?:              Am;
    es?:                   AF;
    is?:                   Am;
    it?:                   AFZa;
    ja?:                   AF;
    sq?:                   Am;
    en_US?:                AF;
    ar?:                   AF;
    bn?:                   AF;
    hu?:                   AFZa;
    nb?:                   Am;
    nn?:                   Am;
    "zh-TW"?:              Am;
    gd?:                   Am;
    el?:                   AFZa;
    fi?:                   AF;
    id?:                   AFZa;
    af?:                   AF;
    am?:                   Am;
    bg?:                   AF;
    ca?:                   AFZa;
    hi?:                   AFZa;
    kab?:                  AF;
    ko?:                   AF;
    lt?:                   AF;
    lv?:                   AF;
    sv?:                   Android;
    th?:                   Am;
    "pl-PL"?:              AF;
    "ru-RU"?:              Am;
    en?:                   AFZa;
    "ar-SA"?:              AFZa;
    "de-DE"?:              AFZa;
    "id-ID"?:              AFZa;
    "ja-JP"?:              AF;
    "nl-NL"?:              Am;
    "uk-UA"?:              Am;
    "pa-PK"?:              Am;
    "en-GB"?:              AF;
    "cs-CZ"?:              AFZa;
    "da-DK"?:              AFZa;
    "el-GR"?:              AFZa;
    "fi-FI"?:              AF;
    "hu-HU"?:              AFZa;
    "it-IT"?:              AFZa;
    "ko-KR"?:              AF;
    "no-NO"?:              Am;
    "sv-SE"?:              AFZa;
    "yo-NG"?:              Am;
    "es-AR"?:              AF;
    nl?:                   Am;
    ast?:                  Am;
    az?:                   Am;
    be?:                   AFZa;
    da?:                   AFZa;
    "en-rUS"?:             EnRUs;
    "es-MX"?:              AF;
    "es-rMX"?:             ArLy;
    eu?:                   AF;
    fa?:                   AF;
    fil?:                  Am;
    gl?:                   Android;
    hr?:                   AFZa;
    in?:                   AFZa;
    iw?:                   AFZa;
    km?:                   Am;
    ku?:                   Am;
    ml?:                   Am;
    ms?:                   Am;
    my?:                   Am;
    "nb-NO"?:              Am;
    "nb-rNO"?:             ArLy;
    ne?:                   Am;
    no?:                   Am;
    pa?:                   Am;
    ps?:                   Am;
    si?:                   Am;
    sk?:                   Am;
    sl?:                   Am;
    sr?:                   Am;
    ta?:                   Am;
    tl?:                   Am;
    ur?:                   Am;
    uz?:                   Am;
    zh?:                   Am;
    mk?:                   AF;
    sc?:                   Am;
    bs?:                   AF;
    "az-AZ"?:              AFZa;
    "bn-BD"?:              AF;
    "hi-IN"?:              AFZa;
    "iw-IL"?:              AF;
    kk?:                   AF;
    "my-MM"?:              Am;
    "te-IN"?:              Am;
    yue?:                  Am;
    "zh-Hans"?:            Am;
    "zh-Hant"?:            Android;
    "gl-ES"?:              Android;
    "ar-AR"?:              Am;
    "fr-CA"?:              AF;
    "eu-ES"?:              AF;
    bo?:                   Am;
    mr?:                   Am;
    "en-AU"?:              AFZa;
    pt_PT?:                Am;
    sr_Cyrl?:              SrCyrl;
    play?:                 Play;
    "fa-IR"?:              AF;
    "zh-rTW"?:             Am;
    "et-EE"?:              AF;
    "he-IL"?:              AFZa;
    "lt-LT"?:              AF;
    "pa-IN"?:              Am;
    "si-LK"?:              Am;
    "sk-SK"?:              Am;
    ckb?:                  Am;
    kn?:                   Am;
    or?:                   Am;
    fa_IR?:                ArLy;
    sat?:                  Am;
    zgh?:                  Am;
    "cz-CZ"?:              ArLy;
    android?:              Android;
    GooglePlayStore?:      GooglePlayStore;
    "bg-BG"?:              AF;
    "ca-ES"?:              AFZa;
    "ceb-PH"?:             Am;
    "es-VE"?:              Am;
    "fil-PH"?:             Am;
    "pcm-NG"?:             Am;
    "sl-SI"?:              Am;
    "tl-PH"?:              Am;
    "ur-PK"?:              Am;
    "de-rDE"?:             AFZa;
    "sv-SV"?:              AFZa;
    "af-ZA"?:              AFZa;
    "ro-RO"?:              Am;
    "sr-SP"?:              Am;
    "vi-VN"?:              Am;
    "en-CA"?:              AFZa;
    "es-419"?:             AF;
    "hy-AM"?:              AFZa;
    "is-IS"?:              Am;
    "ka-GE"?:              AF;
    "km-KH"?:              Am;
    "kmr-TR"?:             Am;
    "kn-IN"?:              Am;
    "ky-KG"?:              Am;
    "lo-LA"?:              Am;
    "mk-MK"?:              AF;
    "ml-IN"?:              Am;
    "mn-MN"?:              Am;
    "mr-IN"?:              Am;
    "ne-NP"?:              Am;
    rm?:                   Am;
    "sc-IT"?:              Am;
    "sq-AL"?:              Am;
    "ta-IN"?:              Am;
    "ur-IN"?:              Am;
    "zh-HK"?:              Am;
    zu?:                   Am;
    zh_Hans?:              Am;
    oc?:                   Am;
    "yi-DE"?:              Am;
    "gr-GR"?:              GrGR;
    "pt-rBR"?:             Am;
    nl_NL?:                Am;
    br?:                   Am;
    ga?:                   Am;
    ht?:                   GooglePlayStore;
    zz?:                   Am;
    "be-BY"?:              AFZa;
    "en-rGB"?:             ArLy;
    "fr-rFR"?:             Am;
    szl?:                  ArLy;
    ua?:                   Am;
    "sr-SR"?:              Am;
    "as-IN"?:              Android;
    "ba-RU"?:              AFZa;
    "br-FR"?:              AFZa;
    "cy-GB"?:              AFZa;
    "dv-MV"?:              AFZa;
    "eo-UY"?:              AF;
    "fy-NL"?:              AF;
    "ga-IE"?:              Android;
    "gn-PY"?:              Android;
    "ha-HG"?:              AFZa;
    ia?:                   AFZa;
    "kab-KAB"?:            AF;
    "kk-KZ"?:              AF;
    "lg-UG"?:              Am;
    "lv-LV"?:              AF;
    "mt-MT"?:              Am;
    "or-IN"?:              Am;
    "sw-KE"?:              Am;
    "tt-RU"?:              Am;
    "ug-CN"?:              Am;
    "uz-UZ"?:              Am;
    nb_NO?:                Am;
    fy?:                   ArYe;
    hy?:                   Am;
    "en-IN"?:              AF;
    fr_CA?:                Am;
    "nb-NB"?:              Am;
    pt_BR?:                Am;
    "in-IN"?:              ArLy;
    "jv-ID"?:              Am;
    "la-LA"?:              Am;
    "sat-IN"?:             Am;
    "th-TH"?:              Am;
    "de-De"?:              ArLy;
    cy?:                   Am;
    te?:                   Am;
    tzm?:                  Am;
    ug?:                   ArYe;
    "zh-Hant-HK"?:         Am;
    "nl-BE"?:              Am;
    graphics?:             Graphics;
    ber?:                  ArLy;
    "zh-rCN"?:             Am;
    "fil-FIL"?:            AF;
    "ur-UR"?:              Am;
    phoneScreenshots?:     PhoneScreenshots;
    "iw-HE"?:              ArLy;
    "nn-NO"?:              Am;
    images?:               Images;
    de_AT?:                Am;
    bn_BD?:                ArLy;
    "es-PE"?:              Am;
    "kor-KR"?:             Am;
    ar_SA?:                Am;
    ca_ES?:                Am;
    de_DE?:                Am;
    el_GR?:                Am;
    es_ES?:                Am;
    eu_ES?:                Am;
    fi_FI?:                Am;
    fr_FR?:                Am;
    id_ID?:                Am;
    it_IT?:                Am;
    ko_KR?:                Am;
    pl_PL?:                Am;
    ru_RU?:                Am;
    sv_SE?:                Am;
    uk_UA?:                Am;
    zh_CN?:                Am;
    zh_TW?:                Am;
    "pt-rPT"?:             Am;
    ka?:                   Am;
    pnb?:                  Bar;
    sp?:                   Am;
    zh_Hant?:              Am;
    "tr_description.txt"?: Am;
    en_GB?:                Am;
    cs_CZ?:                Am;
    bg_BG?:                ArLy;
    ro_MD?:                ArLy;
    "en-us"?:              Android;
    "ms-MY"?:              Am;
    gu?:                   Am;
    "values-nb-NO"?:       GooglePlayStore;
    "af-rZA"?:             GooglePlayStore;
    "ar-rSA"?:             Am;
    "bg-rBG"?:             GooglePlayStore;
    "ca-rES"?:             Am;
    "cs-rCZ"?:             Am;
    "da-rDK"?:             Am;
    "el-rGR"?:             ArYe;
    "eo-rUY"?:             ArYe;
    "es-rES"?:             Am;
    "eu-rES"?:             Am;
    "fa-rIR"?:             Am;
    "fi-rFI"?:             ArYe;
    "hi-rIN"?:             GooglePlayStore;
    "hr-rHR"?:             GooglePlayStore;
    "hu-rHU"?:             Am;
    "hy-rAM"?:             GooglePlayStore;
    "in-rID"?:             Am;
    "it-rIT"?:             Am;
    "iw-rIL"?:             Am;
    "ja-rJP"?:             Am;
    "ko-rKR"?:             ArYe;
    "nl-rNL"?:             Am;
    "no-rNO"?:             GooglePlayStore;
    "pl-rPL"?:             Am;
    "ro-rRO"?:             GooglePlayStore;
    "ru-rRU"?:             Am;
    "sk-rSK"?:             Am;
    "sl-rSI"?:             GooglePlayStore;
    "sr-rCS"?:             Am;
    "sr-rSP"?:             Am;
    "sv-rSE"?:             Am;
    "ta-rIN"?:             GooglePlayStore;
    "te-rIN"?:             Bar;
    "tr-rTR"?:             Am;
    "uk-rUA"?:             Am;
    "vi-rVN"?:             Am;
    "bs-BA"?:              Am;
    "gd-GB"?:              Am;
    "hr-HR"?:              Am;
    "ig-NG"?:              Am;
    "oc-FR"?:              Am;
    "es-CA"?:              AF;
    "es-US"?:              AF;
    "ku-TR"?:              Am;
    "vec-IT"?:             Am;
    "haw-US"?:             ArLy;
    "lb-LU"?:              ArLy;
    "mg-MG"?:              ArLy;
    "sd-PK"?:              ArLy;
    "ar-DZ"?:              GooglePlayStore;
    ar_LY?:                ArLy;
    bar?:                  Bar;
    bm?:                   Bar;
    jv?:                   ArLy;
    nqo?:                  ArLy;
    so?:                   ArLy;
    ti?:                   ArLy;
    tok?:                  ArLy;
    "uz-Latn"?:            ArLy;
    zh_Hant_HK?:           ArLy;
    nl_BE?:                ArLy;
    uz_Latn?:              ArLy;
    "fa-FA"?:              Am;
    "sl-SL"?:              Am;
    "uk-UK"?:              Am;
    "vi-VI"?:              ArYe;
    vec?:                  Am;
    obf?:                  Am;
    off?:                  Am;
    opf?:                  Am;
    opff?:                 Am;
    "qu-PE"?:              Am;
    "kr-KR"?:              Am;
    "zh-Hans-CN"?:         ArLy;
    "zh-Hant-TW"?:         ArLy;
    sn?:                   Bar;
    "ar "?:                Am;
    "el-EL"?:              ArLy;
    "en-au"?:              ArLy;
    lb?:                   ArLy;
    "pa-pk"?:              ArLy;
    "sr-cyrl"?:            ArLy;
    "sr-latn"?:            ArLy;
    ar_YE?:                ArYe;
    ja_CARES?:             ArYe;
    ur_PK?:                ArYe;
    he_IL?:                Am;
    zh_HK?:                Am;
    "nb_NO-V26"?:          GooglePlayStore;
    "ru-Ru"?:              EnRUs;
    "bn-IN"?:              Am;
    sa?:                   Am;
    en_CD?:                En;
    es_419?:               Am;
    "en-EN"?:              En;
}

export interface GooglePlayStore {
    name: string;
}

export interface AF {
    summary?:              string;
    description?:          string;
    name?:                 string;
    whatsNew?:             string;
    featureGraphic?:       string;
    phoneScreenshots?:     string[];
    sevenInchScreenshots?: string[];
    tenInchScreenshots?:   string[];
    video?:                string;
    icon?:                 string;
    promoGraphic?:         string;
    tvBanner?:             string;
    tvScreenshots?:        string[];
    wearScreenshots?:      string[];
}

export interface AFZa {
    description?:          string;
    summary?:              string;
    name?:                 string;
    video?:                string;
    featureGraphic?:       string;
    icon?:                 string;
    promoGraphic?:         string;
    phoneScreenshots?:     string[];
    whatsNew?:             string;
    sevenInchScreenshots?: string[];
    tenInchScreenshots?:   string[];
    tvBanner?:             string;
    tvScreenshots?:        string[];
}

export interface Am {
    summary?:              string;
    whatsNew?:             string;
    description?:          string;
    name?:                 string;
    featureGraphic?:       string;
    phoneScreenshots?:     string[];
    video?:                string;
    icon?:                 string;
    sevenInchScreenshots?: string[];
    tenInchScreenshots?:   string[];
    promoGraphic?:         PromoGraphic;
    tvScreenshots?:        string[];
    wearScreenshots?:      string[];
}

export enum PromoGraphic {
    PromoGraphicG1S43Rz6Qyceb2BmdNWzhQl1DGUIstGSxUxyP5Pcv0PNG = "promoGraphic_g1S43Rz6Qyceb2bmdNWzhQl1DGUIstGSxUxyP-5Pcv0=.png",
    PromoGraphicSVyxmkKkMgq1FrlPgzsr2FvjVZBaYc56Vmi3X4NVlQPNG = "promoGraphic_sVyxmkKkMgq1frlPgzsr2_fvjVZBaYc56vmi3x4nVlQ=.png",
    PromoGraphicYBM7BcbP1VKEo3SWcOXdGO2D4M4O4QkCFeO60H624PNG = "promoGraphic_YBM7bcb-p1vKEo3sWcOXdGO2D4m4O4qk-cFeO60h624=.png",
}

export interface Android {
    icon?:             string;
    phoneScreenshots?: string[];
    whatsNew?:         string;
    description?:      string;
    summary?:          string;
    featureGraphic?:   string;
    name?:             string;
    video?:            string;
}

export interface ArLy {
    description: string;
    summary:     string;
}

export interface ArYe {
    name?:    string;
    summary?: string;
}

export interface Bar {
    summary: string;
}

export interface En {
    phoneScreenshots: string[];
}

export interface EnRUs {
    featureGraphic:   string;
    icon:             string;
    phoneScreenshots: string[];
}

export interface GrGR {
    description: string;
    name:        string;
}

export interface Graphics {
    icon: string;
}

export interface Images {
    phoneScreenshots?: string[];
    featureGraphic?:   string;
    icon?:             string;
    promoGraphic?:     string;
    tvBanner?:         string;
}

export interface PhoneScreenshots {
    icon:            string;
    featureGraphic?: string;
}

export interface Play {
    whatsNew: string;
}

export interface SrCyrl {
    description: string;
    video:       string;
}

export interface Package {
    added:                     number;
    apkName:                   string;
    hash:                      string;
    hashType:                  HashType;
    minSdkVersion?:            number;
    packageName:               string;
    sig?:                      string;
    signer?:                   string;
    size:                      number;
    srcname?:                  string;
    "uses-permission"?:        Array<Array<number | null | string>>;
    versionCode:               number;
    versionName:               string;
    nativecode?:               Nativecode[];
    targetSdkVersion?:         number;
    features?:                 string[];
    "uses-permission-sdk-23"?: Array<Array<number | null | string>>;
    antiFeatures?:             AntiFeature[];
    maxSdkVersion?:            number;
}

export enum HashType {
    Sha256 = "sha256",
}

export enum Nativecode {
    Amd64LinuxGppJNI = "amd64-Linux-gpp/jni",
    Amd64WindowsGppJNI = "amd64-Windows-gpp/jni",
    Arm64V8A = "arm64-v8a",
    ArmLinuxGppJNI = "arm-Linux-gpp/jni",
    Armeabi = "armeabi",
    ArmeabiV7A = "armeabi-v7a",
    I386LinuxGppJNI = "i386-Linux-gpp/jni",
    I386MACOSXGppJNI = "i386-MacOSX-gpp/jni",
    MIPS = "mips",
    Mips64 = "mips64",
    NativecodeArm64V8A = "arm64_v8a",
    Win32X86 = "win32-x86",
    Win32X8664 = "win32-x86_64",
    X86 = "x86",
    X8664 = "x86_64",
    X8664Darwin = "x86_64/darwin",
    X8664MACOSXGppJNI = "x86_64-MacOSX-gpp/jni",
    X86WindowsGppJNI = "x86-Windows-gpp/jni",
}

export interface Repo {
    timestamp:   number;
    version:     number;
    maxage:      number;
    name:        string;
    icon:        string;
    address:     string;
    description: string;
    mirrors:     string[];
}

export interface Requests {
    install:   any[];
    uninstall: any[];
}
