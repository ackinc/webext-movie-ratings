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
  type Context,
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

export type ExceptionMetadata = {
  context?: Record<string, Context>;
  tags?: Record<string, boolean | number | string>;
};
export function captureException(e: unknown, metadata: ExceptionMetadata = {}) {
  e = e instanceof Error ? e : new Error(`${e}`);

  const clonedScope = scope.clone();
  if (globalThis.constructor.name === "Window") {
    const dims = { vw: window.innerWidth, vh: window.innerHeight };
    clonedScope.setContext("pageDims", dims);
  }
  if (metadata.context) {
    Object.entries(metadata.context).forEach(([ctxName, ctxData]) => {
      clonedScope.setContext(ctxName, ctxData);
    });
  }
  if (metadata.tags) clonedScope.setTags(metadata.tags);
  clonedScope.captureException(e);
}
