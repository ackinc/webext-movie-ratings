import { type DBSchema, type IDBPDatabase } from "idb";
import {
  ONE_HOUR_IN_MS,
  ONE_WEEK_IN_MS,
  type CachedIMDBData,
  type IMDBData,
  type ProgramData,
  pick,
} from "../common";

interface RatingsCacheSchema extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
}
interface CacheEntry {
  program: ProgramData;
  imdbData: IMDBData;
}

const storeName = "ratingsStore";
const nfRatingCacheTime = ONE_HOUR_IN_MS * 6;
const imdbRatingCacheTime = ONE_WEEK_IN_MS * 2;

export default class RatingsCache {
  db: IDBPDatabase<RatingsCacheSchema>;

  static upgradeDb(db: IDBPDatabase, oldVersion: number) {
    if (oldVersion < 1) {
      db.createObjectStore(storeName, { keyPath: "key" });
    }
  }

  static async create(
    db: IDBPDatabase,
    data: Record<string, CachedIMDBData> = {},
  ) {
    const cache = new RatingsCache(db as IDBPDatabase<RatingsCacheSchema>);
    await cache.seed(data);
    return cache;
  }

  constructor(db: IDBPDatabase<RatingsCacheSchema>) {
    this.db = db;
  }

  async get(program: ProgramData): Promise<IMDBData | undefined> {
    const cached = await this.db.get(storeName, this.#getKey(program));
    if (!cached || this.#checkExpired(cached)) return undefined;
    return pick(cached, ["imdbID", "imdbRating"]) as IMDBData;
  }

  async put(programsAndRatings: CacheEntry[]): Promise<void> {
    const txn = this.db.transaction([storeName], "readwrite");
    const ratingsStore = txn.objectStore(storeName);

    await Promise.all(
      programsAndRatings.map((data) =>
        ratingsStore.put({
          ...data.imdbData,
          key: this.#getKey(data.program),
          expiry:
            +new Date() +
            (data.imdbData.imdbRating === "N/F"
              ? nfRatingCacheTime
              : imdbRatingCacheTime),
        }),
      ),
    );
  }

  async putOne(entry: CacheEntry) {
    await this.put([entry]);
    return entry;
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
  }

  #getKey(program: ProgramData): string {
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

  #checkExpired(data: CachedIMDBData): boolean {
    return !(
      data.imdbRating &&
      (data.imdbID || data.imdbRating === "N/F") &&
      data.expiry > +new Date()
    );
  }
}
