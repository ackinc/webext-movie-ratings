// using sentry in shared environments like browser extensions is different from using
//   them in normal web apps
// see https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
//   for details

import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from "@sentry/react";
import { browser, getSetting, SettingsKey } from ".";

// filter integrations that use the global variable
const integrations = getDefaultIntegrations({}).filter((defaultIntegration) => {
  return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
    defaultIntegration.name,
  );
});

const client = new BrowserClient({
  dsn: "https://8436ebe51368d33c9c96b92d604db360@o4510696380694528.ingest.us.sentry.io/4510696692187136",
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
  integrations: integrations,

  beforeSend: async (evt) =>
    (await getSetting(SettingsKey.errorReportingOptIn)) ? evt : null,
  environment: BUILDTIME_ENV.DEBUG_MODE ? "development" : "production",
  maxValueLength: 2048,
});

const scope = new Scope();
scope.setTags({ extensionVersion: browser.runtime.getManifest().version });
scope.setClient(client);

client.init();

export function captureException(
  e: Error,
  opts: { addViewportDims: boolean } = { addViewportDims: false },
) {
  if (opts.addViewportDims) {
    const clonedScope = scope.clone();
    clonedScope.setTags({ vw: window.innerWidth, vh: window.innerHeight });
    clonedScope.captureException(e);
  } else {
    scope.captureException(e);
  }
}
