import { type DBSchema, type IDBPDatabase } from "idb";
import { type CachedIMDBData } from "@common";

export interface RatingsCacheSchema extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
}

const storeName = "ratingsStore";

export default class RatingsCache {
  db: IDBPDatabase<RatingsCacheSchema>;

  static upgradeDb(db: IDBPDatabase, oldVersion: number) {
    if (oldVersion < 1) {
      db.createObjectStore(storeName, { keyPath: "key" });
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
}
