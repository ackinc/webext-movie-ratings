declare const APP_ENV: "development" | "testing" | "production";
declare const OMDB_API_KEY: string;
declare const ISOLATED_CONTENT_SCRIPT_PATH: string;
declare const MAIN_CONTENT_SCRIPT_PATH: string;

declare module "*.css";
declare module "*.svg";

// feature flags
declare const FF_TELEMETRY_ENABLED: boolean;
