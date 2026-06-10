import { type DBSchema, type IDBPDatabase } from "idb";
import { type CachedIMDBData, type IMDBData, type ProgramData, pick } from ".";

export interface RatingsCacheSchema extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
}
interface CacheEntry {
  program: ProgramData;
  imdbData: IMDBData;
  expiry: Date;
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

  async get(
    program: ProgramData,
  ): Promise<Omit<CacheEntry, "program"> | undefined> {
    const cached = await this.db.get(storeName, this.getKey(program));
    return cached
      ? {
          imdbData: pick(cached, ["imdbId", "imdbRating"]),
          expiry: new Date(cached.expiry),
        }
      : undefined;
  }

  async put(programsAndRatings: CacheEntry[]): Promise<CacheEntry[]> {
    const txn = this.db.transaction([storeName], "readwrite");
    const ratingsStore = txn.objectStore(storeName);

    await Promise.all(
      programsAndRatings.map((data) =>
        ratingsStore.put({
          ...data.imdbData,
          key: this.getKey(data.program),
          expiry: +data.expiry,
        }),
      ),
    );

    return programsAndRatings;
  }

  async putOne(entry: CacheEntry): Promise<CacheEntry> {
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

  getKey(program: ProgramData): string {
    const { title, type, year } = program;
    // using btoa directly on a title with non-latin1 chars (without
    //   encoding to utf-8 first) will cause an error to be thrown
    const utf8EncodedTitle = String.fromCharCode(
      ...new TextEncoder().encode(title),
    );
    return btoa(
      [utf8EncodedTitle.replace(/[^\w\s]/g, "").toLowerCase(), type, year]
        .filter(Boolean)
        .join("|"),
    );
  }
}
