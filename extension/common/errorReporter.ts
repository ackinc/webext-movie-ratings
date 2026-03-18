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
import type { Context, ErrorEvent, EventHint } from "@sentry/react";
import {
  browser,
  getExtensionContext,
  getSetting,
  ErrorMessage,
  MessageType,
  type Message,
} from "../common";
import { DataExtractionError } from "./customErrors";

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

  beforeSend: async (evt: ErrorEvent, hint: EventHint) => {
    if (["development", "testing"].includes(APP_ENV)) {
      // calls to console.error from extension service worker appear
      //   in the extension error log at chrome://extensions (or equiv. in
      //   other browsers)
      // while this channel logs errors properly, it doesn't do well with
      //   other objects - what appears is "[object Object]" instead of
      //   actually useful data
      // by logging error metadata with console.log instead of console.error,
      //   we prevent useless ("[object Object]") stuff from filling up the
      //   extension error log, while still allowing the observation of the
      //   error metadata from the SW's devtools console
      console.error(hint.originalException);
      console.log(evt.tags);
      console.log(evt.contexts);
    }

    const optedIn = await getSetting("errorReportingOptIn");
    if (!optedIn) return null;

    const errMsg = (hint.originalException as Error)?.message;
    if (errMsg?.startsWith(ErrorMessage.potentiallyOutOfDateSelector)) {
      evt.fingerprint = [
        "{{ default }}",
        "{{ tags.pathname }}",
        "{{ tags.selector }}",
      ];
    }

    return evt;
  },
  environment: APP_ENV,
  maxValueLength: 2048,
});

const scope = new Scope();
if (browser.runtime) {
  scope.setTags({ extensionVersion: browser.runtime.getManifest().version });
}
scope.setClient(client);

client.init();

export type ExceptionMetadata = {
  context?: Record<string, Context>;
  tags?: Record<string, boolean | number | string>;
};
export function captureException(
  e_: unknown,
  metadata: ExceptionMetadata = {},
) {
  const e = e_ instanceof Error ? e_ : new Error(`${e_}`);

  if (FF_TELEMETRY_ENABLED) {
    browser.runtime.sendMessage({
      type: MessageType.error,
      data: {
        errorDetails: { name: e.name, message: e.message, stack: e.stack },
        context: getExtensionContext(),
        pageUrl: globalThis.location.href,
      },
    } satisfies Message);
  }

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
  if (e instanceof DataExtractionError) {
    clonedScope.setContext("datasource", {
      node: e.node,
      selector: e.selector,
    });
  }
  clonedScope.captureException(e);
}
