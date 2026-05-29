#!/usr/bin/env node

// NOTE: The procedure to manually get a new refresh token with the chrome
//   web store permission is described here:
//   https://developer.chrome.com/docs/webstore/using-api#test-oauth

import "dotenv/config";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";

import { delayMs, pick } from "siftutils";

const {
  CWS_PUBLISHER_ID,
  CWS_EXTENSION_ID,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URL,
  GOOGLE_REFRESH_TOKEN,
} = pick(
  process.env,
  [
    "CWS_PUBLISHER_ID",
    "CWS_EXTENSION_ID",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REDIRECT_URL",
    "GOOGLE_REFRESH_TOKEN",
  ],
  true,
);

/* constants */
const cwsBaseUrl = `https://chromewebstore.googleapis.com`;
const cwsName = `publishers/${CWS_PUBLISHER_ID!}/items/${CWS_EXTENSION_ID!}`;
const googleOAuthAuthorizationEndpoint =
  "https://accounts.google.com/o/oauth2/v2/auth";
const googleOAuthTokenEndpoint = "https://oauth2.googleapis.com/token";
const googleOAuthScope = "https://www.googleapis.com/auth/chromewebstore";
const msDelayBetweenFetchUploadStatusRetries = 5000;

// from https://developer.chrome.com/docs/webstore/api/reference/rest/v2/UploadState
const uploadStates = {
  UPLOAD_STATE_UNSPECIFIED: "UPLOAD_STATE_UNSPECIFIED",
  IN_PROGRESS: "IN_PROGRESS",
  SUCCEEDED: "SUCCEEDED",
  FAILED: "FAILED",
  NOT_FOUND: "NOT_FOUND",
};

/* main logic */
const accessToken = await getAccessToken();
console.log(`CWS: obtained access token`);

await uploadPackage();
console.log(`CWS: package upload succeeded`);

await publishPackage();
console.log(`CWS: submitted request to publish new version`);

/* helpers */

async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: GOOGLE_REFRESH_TOKEN!,
    }),
  });
  const { ok, status } = response;
  const body = await response.json();
  if (ok) return body.access_token;

  // if the attempt to get an access token failed due to an expired refresh
  //   token, attempt to procure a new one
  if (["expired", "invalid"].some((x) => body.error.includes(x))) {
    console.log(`CWS: existing tokens expired; attempting to refresh ...`);
    const { accessToken, refreshToken } = await getFreshTokens();
    execSync(
      `sed -E -i 's|^GOOGLE_REFRESH_TOKEN=.*$|GOOGLE_REFRESH_TOKEN="${refreshToken}"|' .env`,
    );
    return accessToken;
  }

  throw new Error(
    `CWS: request to obtain access token failed with status ${status}. Details: ${JSON.stringify(body)}`,
  );
}

function getFreshTokens() {
  return new Promise<{ accessToken: string; refreshToken: string }>(
    (resolve, reject) => {
      const server = http
        .createServer(handleRequest)
        .listen(new URL(GOOGLE_OAUTH_REDIRECT_URL!).port);
      startOAuthFlow();

      function handleRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse,
      ) {
        const url = new URL(`http://localhost${req.url}`);

        if (!(req.method === "GET" && url.pathname === "/")) {
          res.statusCode = 404;
          res.end();
          return;
        }

        const authCode = new URLSearchParams(url.search).get("code");
        if (!authCode) {
          res.statusCode = 400;
          res.end("Invalid request");
          return;
        }

        res.statusCode = 200;
        res.end("This tab can now be closed.");
        server.closeAllConnections();

        exchangeAuthCodeForTokens(authCode).then(resolve).catch(reject);
      }

      async function exchangeAuthCodeForTokens(authCode: string) {
        const response = await fetch(googleOAuthTokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: authCode,
            redirect_uri: GOOGLE_OAUTH_REDIRECT_URL!,
            client_id: GOOGLE_OAUTH_CLIENT_ID!,
            client_secret: GOOGLE_OAUTH_CLIENT_SECRET!,
          }),
        });

        if (!response.ok) {
          const respBody = await response.text();
          throw new Error(
            `Failed to exchange authcode for tokens. Status: ${response.status}. Body: ${respBody}`,
          );
        }

        const { access_token: aT, refresh_token: rT } = await response.json();
        return { accessToken: aT, refreshToken: rT };
      }

      function startOAuthFlow() {
        // WARN:
        // Due to a bug (?) in chrome, opening this endpoint fails with an
        //   'Access blocked: Authorization Error' if the browser in which
        //   it is opened is google-chrome, and the user is already signed-in
        //   to the browser
        // Simply opening the url in chrome's incognito mode, or a different
        //   browser than chrome, makes it work
        // Weird AF
        const url = new URL(googleOAuthAuthorizationEndpoint);
        url.search = new URLSearchParams({
          client_id: GOOGLE_OAUTH_CLIENT_ID!,
          scope: googleOAuthScope,
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          redirect_uri: GOOGLE_OAUTH_REDIRECT_URL!,
        }).toString();

        console.log(url.href);
        execSync(`xdg-open ${url.href}`);
      }
    },
  );
}

async function uploadPackage() {
  const response = await fetch(`${cwsBaseUrl}/upload/v2/${cwsName}:upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/zip",
    },
    body: fs.readFileSync("./dist.zip"),
  });
  const { ok, status } = response;
  const body = await response.json();
  if (!ok || body.uploadState === "FAILED") {
    throw new Error(
      `CWS: request to upload new package failed with status ${status}. Details: ${JSON.stringify(body)}`,
    );
  }
  let { uploadState } = body;
  while (uploadState === uploadStates.IN_PROGRESS) {
    console.log(`CWS: package upload in progress ...`);
    await delayMs(msDelayBetweenFetchUploadStatusRetries);
    try {
      uploadState = await fetchUploadStatus();
    } catch (e) {
      console.error(e);
      // retry
    }
  }

  if (uploadState !== uploadStates.SUCCEEDED) {
    throw new Error(
      `CWS: request to upload new package failed. Details: ${JSON.stringify({ uploadState })}`,
    );
  }
}

async function fetchUploadStatus() {
  const response = await fetch(`${cwsBaseUrl}/v2/${cwsName}:fetchStatus`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `CWS: request to fetch upload status of new package failed with status ${response.status}. Details: ${JSON.stringify(body)}`,
    );
  }
  const { lastAsyncUploadState: uploadState } = body;
  return uploadState;
}

async function publishPackage() {
  const response = await fetch(`${cwsBaseUrl}/v2/${cwsName}:publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const { ok, status } = response;
  if (!ok) {
    const body = await response.json();
    throw new Error(
      `CWS: request to publish new package failed with status ${status}. Details: ${JSON.stringify(body)}`,
    );
  }
}
