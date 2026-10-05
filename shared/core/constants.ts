export const supportedSites = {
  appletv: {
    displayName: "AppleTV",
    hostNames: ["tv.apple.com"],
    permStrings: ["https://tv.apple.com/*"],
    search: "https://tv.apple.com/us/search?term=",
  },
  crunchyroll: {
    displayName: "Crunchyroll",
    hostNames: ["www.crunchyroll.com"],
    permStrings: ["https://www.crunchyroll.com/*"],
    search: "https://www.crunchyroll.com/search?q=",
  },
  // disneyplus: {
  //   displayName: "Disney Plus",
  //   hostNames: ["www.disneyplus.com"],
  //   permStrings: ["https://www.disneyplus.com/*"],
  //   search: ''
  // },
  hbomax: {
    displayName: "HBO Max",
    hostNames: ["www.hbomax.com", "play.hbomax.com"],
    permStrings: ["https://www.hbomax.com/*", "https://play.hbomax.com/*"],
    search: "",
  },
  hotstar: {
    displayName: "Hotstar",
    hostNames: ["www.hotstar.com"],
    permStrings: ["https://www.hotstar.com/*"],
    search: "https://www.hotstar.com/in/explore?search_query=",
  },
  hulu: {
    displayName: "Hulu",
    hostNames: ["www.hulu.com"],
    permStrings: ["https://www.hulu.com/*"],
    search: "",
  },
  mxplayer: {
    displayName: "MX Player",
    hostNames: ["www.mxplayer.in"],
    permStrings: ["https://www.mxplayer.in/*"],
    search: "https://www.mxplayer.in/?search=true&q=",
  },
  netflix: {
    displayName: "Netflix",
    hostNames: ["www.netflix.com"],
    permStrings: ["https://www.netflix.com/*"],
    search: "https://www.netflix.com/search?q=",
  },
  paramountplus: {
    displayName: "Paramount Plus",
    hostNames: ["www.paramountplus.com"],
    permStrings: ["https://www.paramountplus.com/*"],
    search: "",
  },
  peacocktv: {
    displayName: "Peacock TV",
    hostNames: ["www.peacocktv.com"],
    permStrings: ["https://www.peacocktv.com/*"],
    search: "",
  },
  plex: {
    displayName: "Plex",
    hostNames: ["watch.plex.tv"],
    permStrings: ["https://watch.plex.tv/*"],
    search: "https://watch.plex.tv/search?query=",
  },
  primevideo: {
    displayName: "Prime Video (primevideo.com)",
    hostNames: ["www.primevideo.com"],
    permStrings: ["https://www.primevideo.com/*"],
    search: "https://www.primevideo.com/search?ie=UTF8&phrase=",
  },
  primevideoamazondotcom: {
    displayName: "Prime Video (amazon.com/gp/video)",
    hostNames: ["www.amazon.com"],
    permStrings: ["https://www.amazon.com/*"],
    search: "https://www.primevideo.com/search?ie=UTF8&phrase=",
  },
  primevideoamazondotde: {
    displayName: "Prime Video (amazon.de/gp/video)",
    hostNames: ["www.amazon.de"],
    permStrings: ["https://www.amazon.de/*"],
    search: "https://www.primevideo.com/search?ie=UTF8&phrase=",
  },
  sonyliv: {
    displayName: "SonyLIV",
    hostNames: ["www.sonyliv.com"],
    permStrings: ["https://www.sonyliv.com/*"],
    search: "https://www.sonyliv.com/search?q=",
  },
  youtubemovies: {
    displayName: "Youtube Movies",
    hostNames: ["www.youtube.com"],
    permStrings: ["https://www.youtube.com/*"],
    search: "https://www.youtube.com/results?search_query=",
  },
  zee5: {
    displayName: "Zee5",
    hostNames: ["www.zee5.com"],
    permStrings: ["https://www.zee5.com/*"],
    search: "https://www.zee5.com/search?q=",
  },
} as const;

export type Sitename = keyof typeof supportedSites;
export type Sitehost = (typeof supportedSites)[Sitename]["hostNames"][number];
export type PermString =
  (typeof supportedSites)[Sitename]["permStrings"][number];

export const hostToSitename = Object.entries(supportedSites).reduce(
  (acc, [siteName, { hostNames }]) => {
    hostNames.forEach((hostName) => (acc[hostName] = siteName as Sitename));
    return acc;
  },
  {} as Record<Sitehost, Sitename>,
);
export const permStringToSitename = Object.entries(supportedSites).reduce(
  (acc, [sitename, { permStrings }]) =>
    Object.assign(
      acc,
      permStrings.reduce(
        (acc2, ps) => Object.assign(acc2, { [ps]: sitename }),
        {},
      ),
    ),
  {},
) as Record<PermString, Sitename>;
