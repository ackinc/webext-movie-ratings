import { MessageType } from "../common/constants";

patchHistoryPushStateAndReplaceState();

function patchHistoryPushStateAndReplaceState() {
  const { pushState, replaceState } = history;
  history.pushState = function (...args) {
    pushState.apply(history, args);
    window.postMessage({ messageType: MessageType.urlChange });
  };
  history.replaceState = function (...args) {
    replaceState.apply(history, args);
    window.postMessage({ messageType: MessageType.urlChange });
  };
}
