// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import { type IDBPDatabase } from "idb";
import { upgradeIdbAndGetConnection } from "../common";
import TelemetryStore, {
  type TelemetryStoreSchema,
} from "../common/TelemetryStore";
import Dashboard from "./Dashboard";
import "./main.css";

(async () => {
  const db = await upgradeIdbAndGetConnection();
  const telemetryStore = await TelemetryStore.create(
    db as IDBPDatabase<TelemetryStoreSchema>,
    1, // doesn't matter - we're read-only
  );

  const root = document.querySelector<HTMLDivElement>("div#root")!;
  render(<Dashboard telemetryStore={telemetryStore} />, root);
})();
