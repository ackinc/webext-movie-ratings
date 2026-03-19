export type CurPage = "onboarding" | "filters" | "settings";

export const supportedSites = {
  amazonprimevideo: {
    displayName: "Amazon Prime Video",
    permStrings: ["https://www.primevideo.com/*", "https://www.amazon.com/*"],
  },
  appletv: {
    displayName: "AppleTV",
    permStrings: ["https://tv.apple.com/*"],
  },
  crunchyroll: {
    displayName: "Crunchyroll",
    permStrings: ["https://www.crunchyroll.com/*"],
  },
  hotstar: {
    displayName: "Hotstar",
    permStrings: ["https://www.hotstar.com/*"],
  },
  netflix: {
    displayName: "Netflix",
    permStrings: ["https://www.netflix.com/*"],
  },
  sonyliv: {
    displayName: "SonyLIV",
    permStrings: ["https://www.sonyliv.com/*"],
  },
  youtubemovies: {
    displayName: "Youtube Movies",
    permStrings: ["https://www.youtube.com/*"],
  },
} as const;

export type Sitename = keyof typeof supportedSites;
