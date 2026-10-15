import { openDB } from "idb";
import { type IDBPDatabase } from "idb";
import { pick } from "siftutils";
import type { RatingsCacheSchema } from "@common/RatingsCache";
import { idbStoreNames } from "./constants";
import { captureException } from "./errorReporter";
import TelemetryStore from "./TelemetryStore";
import RatingsCache from "./RatingsCache";
import { setSetting } from "./settings";

export async function upgradeIdbAndGetConnection(
  dbName: string,
  dbVersion: number,
) {
  // TODO: pull migration-complete markers from extension storage
  //   and pass them to the upgradeDb functions

  const db = await openDB(dbName, dbVersion, {
    upgrade: (db, oldVersion) => {
      RatingsCache.upgradeDb(db, oldVersion);
      TelemetryStore.upgradeDb(db, oldVersion);
    },
  });
  await setSetting("updatedDbVersion", dbVersion);
  return db;
}

export async function runDataMigrations(db: IDBPDatabase<unknown>) {
  try {
    await moveDataOutOfIncorrectRatingReportsStore(
      db as IDBPDatabase<RatingsCacheSchema>,
    );
  } catch (e) {
    captureException(e);
  }
}

// migrations

async function moveDataOutOfIncorrectRatingReportsStore(
  db: IDBPDatabase<RatingsCacheSchema>,
) {
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

  // TODO: put a "migration-complete" marker in extension storage
}
