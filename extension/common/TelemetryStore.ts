import { type DBSchema, type IDBPDatabase } from "idb";
import {
  invertObj,
  omit,
  shallowEqual,
  type ExtensionContext,
  type WebpageStats,
} from ".";

export interface TelemetryStoreSchema extends DBSchema {
  telemetryStore: {
    key: string;
    value: unknown;
  };
}

type Event =
  | {
      type: "PROGRAM_RATING_REQUEST_RECEIVED";
      data: { pageUrl: string };
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
        sessionStartTime: number;
        stats: WebpageStats;
        pageUrl: string;
        statsCollectionTime: number;
      };
    }
  | {
      type: "ERROR";
      data: {
        errorDetails: {
          name: string;
          message: string;
          stack: string;
        };
        context: ExtensionContext;
        pageUrl?: string;
      };
    };

const storeName = "telemetryStore";
const keyPartSeparator = "::";

const eventTypeToKeyPrefix = {
  PROGRAM_RATING_REQUEST_RECEIVED: "nRatingRequests",
  RATINGS_API_REQUEST_MADE: "nRatingsApiCalls",
  RATINGS_API_RESPONSE_RECEIVED: "ratingsApiResponseTimes",
  WEBPAGE_RATING_STATS_RECEIVED: "webpageRatingStats",
  ERROR: "errors",
} as const satisfies Record<Event["type"], string>;

export default class TelemetryStore {
  db: IDBPDatabase<TelemetryStoreSchema>;
  intervalSizeInSeconds: number;

  static upgradeDb(db: IDBPDatabase, oldVersion: number) {
    if (oldVersion < 2) {
      db.createObjectStore(storeName);
    }
  }

  static async create(
    db: IDBPDatabase<TelemetryStoreSchema>,
    intervalSizeInSeconds: number,
  ) {
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
      const key = [
        eventTypeToKeyPrefix[event.type],
        this.#getIntervalLabel(),
        new URL(event.data.pageUrl).href,
      ].join(keyPartSeparator);

      const curValue = ((await telemetryStore.get(key)) as number) ?? 0;
      await telemetryStore.put(curValue + 1, key);
    } else if (event.type === "RATINGS_API_REQUEST_MADE") {
      const key = [
        eventTypeToKeyPrefix[event.type],
        this.#getIntervalLabel(event.data.startTime),
      ].join(keyPartSeparator);

      const curValue = ((await telemetryStore.get(key)) as number) ?? 0;
      await telemetryStore.put(curValue + 1, key);
    } else if (event.type === "RATINGS_API_RESPONSE_RECEIVED") {
      // need to store every observation to calculate count, mean, p50/95/99
      const key = [
        eventTypeToKeyPrefix[event.type],
        this.#getIntervalLabel(event.data.startTime),
      ].join(keyPartSeparator);

      const curValue = ((await telemetryStore.get(key)) as number[]) ?? [];
      await telemetryStore.put(curValue.concat(event.data.durationMs), key);
    } else if (event.type === "WEBPAGE_RATING_STATS_RECEIVED") {
      const { sessionStartTime, pageUrl, statsCollectionTime, stats } =
        event.data;
      const key = [
        eventTypeToKeyPrefix[event.type],
        this.#getIntervalLabel(sessionStartTime),
        pageUrl,
      ].join(keyPartSeparator);
      const curVal = (await telemetryStore.get(key)) as
        | { stats: WebpageStats; lastUpdated: number }
        | undefined;
      if (curVal && shallowEqual(stats, omit(curVal, ["lastUpdated"]))) return;
      await telemetryStore.put(
        { ...stats, lastUpdated: statsCollectionTime },
        key,
      );
    } else if (event.type === "ERROR") {
      const { errorDetails, context, pageUrl } = event.data;

      const key = [
        eventTypeToKeyPrefix[event.type],
        this.#getIntervalLabel(),
        context,
        pageUrl,
      ]
        .filter((x) => x)
        .join(keyPartSeparator);
      const curVal: Set<Error> =
        ((await telemetryStore.get(key)) as Set<Error> | undefined) ??
        new Set<Error>();
      await telemetryStore.put(curVal.add(errorDetails), key);
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
