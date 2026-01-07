import "dotenv/config";
import * as fs from "node:fs";
import jwt from "jsonwebtoken";

const { MAS_JWT_ISSUER, MAS_JWT_SECRET, MAS_ADDON_GUID } = process.env;

/* constants */
const baseUrl = `https://addons.mozilla.org`;
const msDelayBetweenFetchUploadStatusRetries = 5000;

const uploadStates = {
  IN_PROGRESS: "InProgress",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
};

/* main logic */
const authToken = getAuthToken();

const uploadUuid = await uploadPackage();
console.log(`MAS: package upload succeeded`);

const sourceUuid = await uploadSource();
console.log(`MAS: source package upload succeeded`);

await publishPackage();
console.log(`MAS: submitted request to publish new version`);

/* helpers */

function getAuthToken() {
  var issuedAt = Math.floor(Date.now() / 1000);
  var payload = {
    iss: MAS_JWT_ISSUER,
    jti: Math.random().toString(),
    iat: issuedAt,
    exp: issuedAt + 120,
  };
  return jwt.sign(payload, MAS_JWT_SECRET, { algorithm: "HS256" });
}

async function uploadPackage() {
  const file = new File([fs.readFileSync("./dist.zip")], "dist.zip", {
    type: "application/zip",
  });
  const formData = new FormData();
  formData.append("upload", file);
  formData.append("channel", "listed");

  const response = await fetch(`${baseUrl}/api/v5/addons/upload/`, {
    method: "POST",
    headers: {
      Authorization: `JWT ${authToken}`,

      // Setting this header manually results in a "multipart form parse
      //   - invalid boundary" error in the response
      // The solution appears to be to let the library set the header by itself,
      //   instead of setting it manually
      // "Content-Type": "multipart/form-data",
    },
    body: formData,
  });
  const { ok, status } = response;
  const body = await response.json();
  if (!ok) {
    throw new Error(
      `MAS: request to upload new package failed with status ${status}. Details: ${JSON.stringify(body)}`
    );
  }
  let { uuid, processed, valid, validation } = body;

  let uploadState = !processed
    ? uploadStates.IN_PROGRESS
    : valid
      ? uploadStates.SUCCEEDED
      : uploadStates.FAILED;
  while (uploadState === uploadStates.IN_PROGRESS) {
    console.log(`MAS: package upload in progress ...`);
    await delayMs(msDelayBetweenFetchUploadStatusRetries);
    try {
      ({ uploadState, validation } = await fetchUploadStatus(uuid));
    } catch (e) {
      console.error(e);
      // retry
    }
  }

  if (uploadState !== uploadStates.SUCCEEDED) {
    throw new Error(
      `MAS: request to upload new package failed. Details: ${JSON.stringify({ uploadState, validation })}`
    );
  }

  return uuid;
}

async function fetchUploadStatus(uuid) {
  const response = await fetch(`${baseUrl}/api/v5/addons/upload/${uuid}/`, {
    method: "GET",
    headers: {
      Authorization: `JWT ${authToken}`,
    },
  });
  const { ok, status } = response;
  const body = await response.json();
  if (!ok) {
    throw new Error(
      `MAS: request to fetch upload status of new package failed with status ${status}. Details: ${JSON.stringify(body)}`
    );
  }
  const { processed, valid, validation } = body;

  return {
    uploadState: !processed
      ? uploadStates.IN_PROGRESS
      : valid
        ? uploadStates.SUCCEEDED
        : uploadStates.FAILED,
    validation,
  };
}

async function uploadSource() {
  const file = new File([fs.readFileSync("./src.zip")], "dist.zip", {
    type: "application/zip",
  });
  const formData = new FormData();
  formData.append("source", file);
  formData.append("upload", uploadUuid);

  const response = await fetch(
    `${baseUrl}/api/v5/addons/addon/${MAS_ADDON_GUID}/versions/`,
    {
      method: "POST",
      headers: {
        Authorization: `JWT ${authToken}`,

        // Setting this header manually results in a "multipart form parse
        //   - invalid boundary" error in the response
        // The solution appears to be to let the library set the header by itself,
        //   instead of setting it manually
        // "Content-Type": "multipart/form-data",
      },
      body: formData,
    }
  );
  const { ok, status } = response;
  const body = await response.json();
  if (!ok) {
    throw new Error(
      `MAS: request to upload source package failed with status ${status}. Details: ${JSON.stringify(body)}`
    );
  }

  return body.uuid;
}

async function publishPackage() {
  const response = await fetch(
    `${baseUrl}/api/v5/addons/addon/${MAS_ADDON_GUID}/versions/`,
    {
      method: "POST",
      headers: {
        Authorization: `JWT ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compatibility: ["android", "firefox"],
        source: sourceUuid,
        upload: uploadUuid,
      }),
    }
  );
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
