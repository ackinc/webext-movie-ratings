import { hostToSitename } from "./constants";
import { type Sitehost } from "./constants";

export function urlToSitename(url: URL | string) {
  url = url instanceof URL ? url : new URL(url);
  const { hostname } = new URL(url);
  if (!(hostname in hostToSitename))
    throw new Error(`Unsupported site: ${url}`);
  return hostToSitename[hostname as Sitehost];
}
