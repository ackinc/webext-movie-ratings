import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://b0fd0ca47ce2f4d1f87fd07dd42aff47@o4510696380694528.ingest.us.sentry.io/4511347396247553",
  environment: process.env["APP_ENV"] ?? "production",
  sendDefaultPii: false,
});

export default Sentry;
