import { type DBSchema, type IDBPDatabase } from "idb";

interface TelemetryStoreSchema extends DBSchema {
  telemetryStore: {
    key: string;
    value: unknown;
  };
}

const storeName = "telemetryStore";
const eventTypesToTelemetryKeyPrefixes = {
  RATINGS_API_CALL: "nApiCalls",
  PROGRAM_RATING_REQUEST: "nRatingRequests",
} as const;

export default class TelemetryStore {
  db: IDBPDatabase<TelemetryStoreSchema>;
  intervalSizeInSeconds: number;

  static upgradeDb(db: IDBPDatabase, oldVersion: number) {
    if (oldVersion < 2) {
      db.createObjectStore(storeName);
    }
  }

  static async create(db: IDBPDatabase, intervalSizeInSeconds: number) {
    const store = new TelemetryStore(
      db as IDBPDatabase<TelemetryStoreSchema>,
      intervalSizeInSeconds,
    );
    return store;
  }

  constructor(
    db: IDBPDatabase<TelemetryStoreSchema>,
    intervalSizeInSeconds: number,
  ) {
    this.db = db;
    this.intervalSizeInSeconds = intervalSizeInSeconds;
  }

  async logEvent(
    eventType: keyof typeof eventTypesToTelemetryKeyPrefixes,
    data?: unknown,
  ) {
    const txn = this.db.transaction(storeName, "readwrite");
    const telemetryStore = txn.objectStore(storeName);

    const key = this.#getEventKey(eventType, data);

    const curCount = ((await telemetryStore.get(key)) as number) ?? 0;
    await telemetryStore.put(curCount + 1, key);
  }

  #getEventKey(
    eventType: keyof typeof eventTypesToTelemetryKeyPrefixes,
    data?: unknown,
  ): string {
    if (!(eventType in eventTypesToTelemetryKeyPrefixes)) {
      throw new Error(`Unrecognized event type: ${eventType}`);
    }

    if (eventType === "RATINGS_API_CALL") {
      return `${eventTypesToTelemetryKeyPrefixes[eventType]}::${this.#getCurrentInterval()}`;
    }

    if (eventType === "PROGRAM_RATING_REQUEST") {
      const { pageUrl } = data as { pageUrl: string };
      const keyParts: string[] = [
        eventTypesToTelemetryKeyPrefixes[eventType],
        this.#getCurrentInterval().toString(),
      ];
      if (pageUrl) {
        const url = new URL(pageUrl);
        keyParts.push(url.origin, url.href);
      }
      return keyParts.join("::");
    }

    return "" as never;
  }

  // Examples:
  // - intervalSize === 01s; 1772722745434 => 1772722746000,
  // - intervalSize === 10s; 1772722745434 => 1772722750000,
  #getCurrentInterval(): number {
    return (
      Math.ceil(+new Date() / (this.intervalSizeInSeconds * 1000)) *
      this.intervalSizeInSeconds *
      1000
    );
  }
}
