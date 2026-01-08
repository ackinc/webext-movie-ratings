import "@types/chrome";

declare global {
  const BUILDTIME_ENV: {
    DEBUG_MODE: boolean;
    OMDB_API_KEY: string;
  };
}
