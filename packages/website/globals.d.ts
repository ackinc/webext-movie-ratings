declare module "*.css";

declare interface ImportMeta {
  env: ImportMetaEnv;
}

declare interface ImportMetaEnv {
  DEV: boolean;
}
