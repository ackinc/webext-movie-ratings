import "dotenv/config";
import * as fs from "node:fs";

const {
  CWS_PUBLISHER_ID,
  CWS_EXTENSION_ID,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

/* constants */
const cwsBaseUrl = `https://chromewebstore.googleapis.com`;
const cwsName = `publishers/${CWS_PUBLISHER_ID}/items/${CWS_EXTENSION_ID}`;
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
  // NOTE: if unable to get access token because of expired refresh token, use the
  //   google oauth playground (https://developers.google.com/oauthplayground/)
  //   to get a new refresh token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: GOOGLE_REFRESH_TOKEN,
    }),
  });
  const { ok, status } = response;
  const body = await response.json();
  if (!ok) {
    throw new Error(
      `CWS: request to obtain access token failed with status ${status}. Details: ${JSON.stringify(body)}`
    );
  }
  const { access_token: accessToken } = body;
  return accessToken;
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
      `CWS: request to upload new package failed with status ${status}. Details: ${JSON.stringify(body)}`
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
      `CWS: request to upload new package failed. Details: ${JSON.stringify({ uploadState })}`
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
      `CWS: request to fetch upload status of new package failed with status ${response.status}. Details: ${JSON.stringify(body)}`
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
      `CWS: request to publish new package failed with status ${status}. Details: ${JSON.stringify(body)}`
    );
  }
}

async function delayMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
