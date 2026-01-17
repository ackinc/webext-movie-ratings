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
import { getErrorReportingOptInState } from ".";

// filter integrations that use the global variable
const integrations = getDefaultIntegrations({}).filter((defaultIntegration) => {
  return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
    defaultIntegration.name
  );
});

const client = new BrowserClient({
  dsn: "https://8436ebe51368d33c9c96b92d604db360@o4510696380694528.ingest.us.sentry.io/4510696692187136",
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
  integrations: integrations,

  beforeSend: async (evt) =>
    (await getErrorReportingOptInState()) ? evt : null,
  environment: BUILDTIME_ENV.DEBUG_MODE ? "development" : "production",
  maxValueLength: 2048,
});

const scope = new Scope();
scope.setClient(client);

client.init();

export default scope;
