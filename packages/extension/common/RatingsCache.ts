import { type DBSchema, type IDBPDatabase } from "idb";
import { addMilliseconds } from "date-fns";
import {
  ONE_WEEK_IN_MS,
  type CachedIMDBData,
  type IMDBData,
  type ProgramData,
  pick,
} from ".";

export interface RatingsCacheSchema extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
}
interface CacheEntry {
  program: ProgramData;
  imdbData: IMDBData;
  expiry?: Date;
}

const storeName = "ratingsStore";
const nfRatingCacheTime = ONE_WEEK_IN_MS;
const imdbRatingCacheTime = ONE_WEEK_IN_MS * 2;

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
  ): Promise<Omit<Required<CacheEntry>, "program"> | undefined> {
    const cached = await this.db.get(storeName, this.getKey(program));
    return cached
      ? {
          imdbData: pick(cached, ["imdbID", "imdbRating"]),
          expiry: new Date(cached.expiry),
        }
      : undefined;
  }

  async put(programsAndRatings: CacheEntry[]): Promise<Required<CacheEntry>[]> {
    const txn = this.db.transaction([storeName], "readwrite");
    const ratingsStore = txn.objectStore(storeName);

    const entriesToPut = programsAndRatings.map((data) => ({
      ...data,
      expiry:
        data.expiry ??
        addMilliseconds(
          new Date(),
          data.imdbData.imdbRating === "N/F"
            ? nfRatingCacheTime
            : imdbRatingCacheTime,
        ),
    }));

    await Promise.all(
      entriesToPut.map((data) =>
        ratingsStore.put({
          ...data.imdbData,
          key: this.getKey(data.program),
          expiry: +data.expiry,
        }),
      ),
    );

    return entriesToPut;
  }

  async putOne(entry: CacheEntry): Promise<Required<CacheEntry>> {
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
