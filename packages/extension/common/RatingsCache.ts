import { type DBSchema, type IDBPDatabase } from "idb";
import { type CachedIMDBData, type IMDBData, type Program } from "@common";

type CachedIncorrectRatingReport = Omit<Program, "container" | "node"> &
  IMDBData & { pageUrl: string } & { key: string; reportedAt: number };

export interface RatingsCacheSchema extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
  incorrectRatingReportsStore: {
    key: string;
    value: CachedIncorrectRatingReport;
  };
}

const storeName = "ratingsStore";
const incorrectRatingReportsStoreName = "incorrectRatingReportsStore";

export default class RatingsCache {
  db: IDBPDatabase<RatingsCacheSchema>;

  static upgradeDb(db: IDBPDatabase, oldVersion: number) {
    if (oldVersion < 1) {
      db.createObjectStore(storeName, { keyPath: "key" });
    }
    if (oldVersion < 3) {
      db.createObjectStore(incorrectRatingReportsStoreName, { keyPath: "key" });
    }
  }

  static async create(
    db: IDBPDatabase<RatingsCacheSchema>,
    data: Record<string, CachedIMDBData> = {},
  ) {
    return await new RatingsCache(db).seed(data);
  }

  constructor(db: IDBPDatabase<RatingsCacheSchema>) {
    this.db = db;
  }

  async get(key: string): Promise<CachedIMDBData | undefined> {
    return await this.db.get(storeName, key);
  }

  async put(entries: CachedIMDBData[]): Promise<CachedIMDBData[]> {
    const txn = this.db.transaction([storeName], "readwrite");
    const ratingsStore = txn.objectStore(storeName);
    await Promise.all(entries.map((data) => ratingsStore.put(data)));
    return entries;
  }

  async putOne(entry: CachedIMDBData): Promise<CachedIMDBData> {
    return (await this.put([entry]))[0]!;
  }

  // useful when migrating previously cached data from elsewhere
  async seed(data: Record<string, CachedIMDBData>) {
    const txn = this.db.transaction([storeName], "readwrite");
    const ratingsStore = txn.objectStore(storeName);
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        ratingsStore.put({ ...value, key }),
      ),
    );
    return this;
  }

  async putIncorrectRatingReport(value: CachedIncorrectRatingReport) {
    const txn = this.db.transaction(
      [incorrectRatingReportsStoreName],
      "readwrite",
    );
    const store = txn.objectStore(incorrectRatingReportsStoreName);
    await store.put(value);
    return value;
  }

  async getIncorrectRatingReport(key: string) {
    return await this.db.get(incorrectRatingReportsStoreName, key);
  }
}
