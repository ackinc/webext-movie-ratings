import { openDB } from "idb";
import { type IDBPDatabase } from "idb";
import { pick } from "siftutils";
import { idbStoreNames } from "./constants";
import TelemetryStore from "./TelemetryStore";
import RatingsCache from "./RatingsCache";
import { setSetting } from "./settings";
import * as storage from "./storage";

export async function upgradeIdbAndGetConnection(
  dbName: string,
  dbVersion: number,
) {
  const completedMigrations = await getCompletedMigrations();
  const db = await openDB(dbName, dbVersion, {
    upgrade: (db, oldVersion) => {
      RatingsCache.upgradeDb(db, oldVersion, completedMigrations);
      TelemetryStore.upgradeDb(db, oldVersion, completedMigrations);
    },
  });
  await setSetting("updatedDbVersion", dbVersion);
  await runPendingMigrations(db);
  return db;
}

// data migrations

export const allIdbMigrations = {
  moveDataOutOfIncorrectRatingReportsStore: {
    order: 1,
    name: "moveDataOutOfIncorrectRatingReportsStore",
    fn: moveDataOutOfIncorrectRatingReportsStore,
  },
} as const;

export type IdbMigrationName = keyof typeof allIdbMigrations;

const completedMigrationsKey = "completedMigrations";

async function getCompletedMigrations() {
  return (await storage.get<IdbMigrationName[]>(completedMigrationsKey)) ?? [];
}

async function markMigrationCompleted(name: IdbMigrationName) {
  return await storage.set<IdbMigrationName[]>(
    completedMigrationsKey,
    (await getCompletedMigrations()).concat([name]),
  );
}

async function runPendingMigrations(db: IDBPDatabase<unknown>) {
  const completedMigrations = await getCompletedMigrations();

  const migrations = Object.values(allIdbMigrations).sort(
    (a, b) => a.order - b.order,
  );
  for (const migration of migrations) {
    if (!completedMigrations.includes(migration.name)) {
      await migration.fn(db);
      await markMigrationCompleted(migration.name);
    }
  }
}

async function moveDataOutOfIncorrectRatingReportsStore(db: IDBPDatabase) {
  if (!db.objectStoreNames.contains(idbStoreNames.incorrectRatingReports)) {
    return;
  }

  const txn = db.transaction(
    [idbStoreNames.incorrectRatingReports, idbStoreNames.ratings],
    "readwrite",
  );
  const ratingsStore = txn.objectStore(idbStoreNames.ratings);
  const irrStore = txn.objectStore(idbStoreNames.incorrectRatingReports);

  const expiryVal = +new Date() - 1;
  const incorrectRatingReports = await irrStore.getAll();
  await Promise.all(
    incorrectRatingReports
      .flatMap((irr) => [
        ratingsStore.put({
          ...pick(irr, ["imdbId", "imdbRating"]),
          wasReportedIncorrect: true,
          key: irr.key,
          expiry: expiryVal,
        }),
        irrStore.delete(irr.key),
      ])
      .concat(txn.done),
  );

  // Ideally we would delete the obsolete incorrect-rating-reports object
  //   store here, but IDB requires db.deleteObjectStore to be called
  //   inside a 'versionchange' transaction
  // Such a transaction is only created inside IDB's onupgradeneeded
  //   event handler, which runs at IDB connection-open time, long
  //   before we ever get __here__
}
