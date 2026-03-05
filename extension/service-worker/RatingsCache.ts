import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION } from "./constants";
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

const storeName = "ratingsStore";
const nfRatingCacheTime = ONE_HOUR_IN_MS * 6;
const imdbRatingCacheTime = ONE_WEEK_IN_MS * 2;

// TODO: throw error when get/put called before db is ready

export default class RatingsCache {
  db: IDBPDatabase<RatingsCacheSchema>;

  static async createFrom(data: Record<string, CachedIMDBData> = {}) {
    const db = await openDB<RatingsCacheSchema>(DB_NAME, DB_VERSION, {
      upgrade: (db, oldVersion) => {
        if (oldVersion < 1) {
          db.createObjectStore(storeName, { keyPath: "key" });
        }
      },
    });

    const cache = new RatingsCache(db);
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

  async put(
    programsAndRatings: { program: ProgramData; imdbData: IMDBData }[],
  ): Promise<void> {
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
