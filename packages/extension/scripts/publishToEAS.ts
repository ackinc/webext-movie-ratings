#!/usr/bin/env node

// if the publish API key expires, get a new one from
//   https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi

import "dotenv/config";
import * as fs from "node:fs";
import { delayMs, pick } from "siftutils";

const { EAS_CLIENT_ID, EAS_PUBLISH_API_KEY, EAS_PRODUCT_ID } = pick(
  process.env,
  ["EAS_CLIENT_ID", "EAS_PUBLISH_API_KEY", "EAS_PRODUCT_ID"],
  true,
) as Record<string, string>;

/* constants */
const easBaseUrl = `https://api.addons.microsoftedge.microsoft.com`;
const msDelayBetweenFetchUploadStatusRetries = 5000;

// from https://learn.microsoft.com/en-us/microsoft-edge/extensions/update/api/addons-api-reference?tabs=v1-1#response-1
const uploadStates = {
  IN_PROGRESS: "InProgress",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
};

/* main logic */
await uploadPackage();
console.log(`EAS: package upload succeeded`);

await publishPackage();
console.log(`EAS: submitted request to publish new version`);

/* helpers */

async function uploadPackage() {
  const response = await fetch(
    `${easBaseUrl}/v1/products/${EAS_PRODUCT_ID}/submissions/draft/package`,
    {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${EAS_PUBLISH_API_KEY}`,
        "Content-Type": "application/zip",
        "X-ClientID": EAS_CLIENT_ID!,
      },
      body: fs.readFileSync("./dist.zip"),
    },
  );
  const { ok, status, headers } = response;
  if (!ok) {
    throw new Error(
      `EAS: request to upload new package failed with status ${status}.`,
    );
  }
  const operationId = headers.get("location")!;

  let uploadState = uploadStates.IN_PROGRESS;
  while (uploadState === uploadStates.IN_PROGRESS) {
    console.log(`EAS: package upload in progress ...`);
    await delayMs(msDelayBetweenFetchUploadStatusRetries);
    try {
      uploadState = await fetchUploadStatus(operationId);
    } catch (e) {
      console.error(e);
      // retry
    }
  }

  if (uploadState !== uploadStates.SUCCEEDED) {
    throw new Error(
      `EAS: request to upload new package failed. Details: ${JSON.stringify({ uploadState })}`,
    );
  }
}

async function fetchUploadStatus(operationId: string) {
  const response = await fetch(
    `${easBaseUrl}/v1/products/${EAS_PRODUCT_ID}/submissions/draft/package/operations/${operationId}`,
    {
      method: "GET",
      headers: {
        Authorization: `ApiKey ${EAS_PUBLISH_API_KEY}`,
        "X-ClientID": EAS_CLIENT_ID!,
      },
    },
  );
  const { ok, status } = response;
  const body = await response.json();
  if (!ok) {
    throw new Error(
      `EAS: request to fetch upload status of new package failed with status ${status}. Details: ${JSON.stringify(body)}`,
    );
  }

  // WARN: losing out on logging errors if body.status === uploadedStates.FAILED
  return body.status;
}

async function publishPackage() {
  const response = await fetch(
    `${easBaseUrl}/v1/products/${EAS_PRODUCT_ID}/submissions`,
    {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${EAS_PUBLISH_API_KEY}`,
        "X-ClientID": EAS_CLIENT_ID!,
      },
    },
  );
  const { ok, status } = response;
  if (!ok) {
    const body = await response.json();
    throw new Error(
      `CWS: request to publish new package failed with status ${status}. Details: ${JSON.stringify(body)}`,
    );
  }
}
