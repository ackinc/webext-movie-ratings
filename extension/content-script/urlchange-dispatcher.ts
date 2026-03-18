import { MessageType } from "../common/constants";
import { type Message } from "../common/types";

window.addEventListener("message", handleMessage);
const restorePatchedFns = patchHistoryPushStateAndReplaceState();

function handleMessage(ev: MessageEvent<unknown>) {
  const { type } = ev;
  if (!(typeof type === "string" && type.startsWith("sift:"))) return;

  if (type === MessageType.removeUrlChangeDispatcher) {
    window.removeEventListener("message", handleMessage);
    restorePatchedFns();
  }
}

function patchHistoryPushStateAndReplaceState() {
  const { pushState, replaceState } = history;

  history.pushState = function (...args) {
    pushState.apply(history, args);
    window.postMessage({ type: MessageType.urlChange } satisfies Message);
  };
  history.replaceState = function (...args) {
    replaceState.apply(history, args);
    window.postMessage({ type: MessageType.urlChange } satisfies Message);
  };

  return () => {
    history.pushState = pushState;
    history.replaceState = replaceState;
  };
}
