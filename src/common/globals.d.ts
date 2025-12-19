import type AbstractPage from "./AbstractPage";

declare global {
  interface Window {
    __page: AbstractPage;
  }

  const BUILDTIME_ENV: {
    DEBUG_MODE: boolean;
    OMDB_API_KEY: string;
  };
}
