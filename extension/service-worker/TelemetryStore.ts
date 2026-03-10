import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { ErrorMessage, omit, shallowEqual, type WebpageStats } from "../common";
import { DB_NAME, DB_VERSION } from "./constants";
import { getSetting, waitFor } from "../common";

export interface TelemetryStoreSchema extends DBSchema {
  telemetryStore: {
    key: string;
    value: unknown;
  };
}

type Event =
  | {
      type: "PROGRAM_RATING_REQUEST_RECEIVED";
      data: { pageUrl: string | undefined };
    }
  | {
      type: "RATINGS_API_REQUEST_MADE";
      data: { startTime: number };
    }
  | {
      type: "RATINGS_API_RESPONSE_RECEIVED";
      data: { startTime: number; durationMs: number };
    }
  | {
      type: "WEBPAGE_RATING_STATS_RECEIVED";
      data: {
        id: string;
        stats: WebpageStats;
        pageUrl: string;
        timestamp: number;
      };
    };

const storeName = "telemetryStore";
const keyPartSeparator = "::";

export default class TelemetryStore {
  db: IDBPDatabase<TelemetryStoreSchema>;
  intervalSizeInSeconds: number;

  static upgradeDb(db: IDBPDatabase, oldVersion: number) {
    if (oldVersion < 2) {
      db.createObjectStore(storeName);
    }
  }

  static async create(
    db: IDBPDatabase<TelemetryStoreSchema> | undefined,
    intervalSizeInSeconds: number,
  ) {
    if (!db) {
      // Db-upgrade code lives inside the service worker initialization logic
      // We don't want to be opening new idb connections from here until the
      //   service worker has had time to finish upgrading the DB
      await waitFor(
        async () => (await getSetting("updatedDbVersion")) === DB_VERSION,
        60,
        1000,
      );

      db = await openDB<TelemetryStoreSchema>(DB_NAME, DB_VERSION, {
        upgrade: () => {
          throw new Error(ErrorMessage.idbUpgradeCalledUnexpectedly);
        },
      });
    }

    return new TelemetryStore(db, intervalSizeInSeconds);
  }

  constructor(
    db: IDBPDatabase<TelemetryStoreSchema>,
    intervalSizeInSeconds: number,
  ) {
    this.db = db;
    this.intervalSizeInSeconds = intervalSizeInSeconds;
  }

  async logEvent(event: Event) {
    const txn = this.db.transaction(storeName, "readwrite");
    const telemetryStore = txn.objectStore(storeName);

    if (event.type === "PROGRAM_RATING_REQUEST_RECEIVED") {
      let key = [this.#getIntervalLabel(), "nRatingRequests"].join(
        keyPartSeparator,
      );
      if (event.data.pageUrl) {
        const url = new URL(event.data.pageUrl);
        key = [key, url.href].join(keyPartSeparator);
      }

      const curValue = ((await telemetryStore.get(key)) as number) ?? 0;
      await telemetryStore.put(curValue + 1, key);
    } else if (event.type === "RATINGS_API_REQUEST_MADE") {
      const key = [
        this.#getIntervalLabel(event.data.startTime),
        "nRatingsApiCalls",
      ].join(keyPartSeparator);

      const curValue = ((await telemetryStore.get(key)) as number) ?? 0;
      await telemetryStore.put(curValue + 1, key);
    } else if (event.type === "RATINGS_API_RESPONSE_RECEIVED") {
      // need to store every observation to calculate count, mean, p50/95/99
      const key = [
        this.#getIntervalLabel(event.data.startTime),
        "ratingsApiResponseTimes",
      ].join(keyPartSeparator);

      const curValue = ((await telemetryStore.get(key)) as number[]) ?? [];
      await telemetryStore.put(curValue.concat(event.data.durationMs), key);
    } else if (event.type === "WEBPAGE_RATING_STATS_RECEIVED") {
      const { id, pageUrl, timestamp, stats } = event.data;
      const key = ["webpageRatingStats", pageUrl, id].join(keyPartSeparator);
      const curVal = (await telemetryStore.get(key)) as
        | { stats: WebpageStats; timestamp: number }
        | undefined;
      if (curVal && shallowEqual(stats, omit(curVal, ["timestamp"]))) return;
      await telemetryStore.put({ ...stats, timestamp }, key);
    }
  }

  // Examples:
  // - intervalSize === 01s; 1772722745434 => 1772722746000,
  // - intervalSize === 10s; 1772722745434 => 1772722750000,
  #getIntervalLabel(time = +new Date()): string {
    return (
      Math.ceil(time / (this.intervalSizeInSeconds * 1000)) *
      this.intervalSizeInSeconds *
      1000
    ).toString();
  }
}
