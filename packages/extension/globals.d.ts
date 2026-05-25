declare const APP_ENV: "development" | "testing" | "production";

// there's no reliable way to detect what browser we're running on
//   at runtime (UserAgent sniffing is unreliable), so we use a
//   compile-time const to do this
declare const TARGET_BROWSER: "chrome" | "firefox" | "edge";

declare const SIFT_API_URL: string;
declare const SIFT_WEBSITE_URL: string;

declare const OMDB_API_KEY: string;
declare const ISOLATED_CONTENT_SCRIPT_PATH: string;
declare const MAIN_CONTENT_SCRIPT_PATH: string;

declare module "*.css";
declare module "*.png";
declare module "*.svg";

// feature flags
declare const FF_TELEMETRY_ENABLED: boolean;
declare const FF_HALT_LOOP_WHEN_PAGE_NOT_VISIBLE: boolean;
