import { createContext } from "preact";
import type { StateUpdater } from "preact/hooks";
import type { PopupPage } from "../common";

const SetCurPageContext = createContext<
  (arg0: StateUpdater<PopupPage>) => void
>(() => {});
export default SetCurPageContext;
