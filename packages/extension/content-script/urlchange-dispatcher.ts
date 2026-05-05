declare global {
  interface Window {
    __origHistoryPushState?: typeof History.prototype.pushState;
    __origHistoryReplaceState?: typeof History.prototype.replaceState;
  }
}

import { waitFor } from "siftutils";
import { MessageType } from "../common/constants";
import { type Message } from "../common/types";

// MAIN world content scripts run in a shared context
// Putting their contents inside an IIFE ensures the const sourceId
//   declaration below won't result in a "variable already declared" error
//   when a new version of the urlchange-dispatcher content script is injected
(async () => {
  const sourceId = Math.random();
  window.postMessage({
    type: MessageType.outdatedUrlChangeDispatcherCleanup,
    data: { sourceId },
  });

  await waitFor(
    () => !(window.__origHistoryPushState || window.__origHistoryReplaceState),
  );

  window.addEventListener("message", handleMessage);
  patchHistoryPushStateAndReplaceState();

  // helpers

  function handleMessage(ev: MessageEvent<unknown>) {
    const msg = ev.data as Message;
    const { type } = msg;

    if (type === MessageType.cleanup) {
      cleanup();
    } else if (type === MessageType.outdatedUrlChangeDispatcherCleanup) {
      // if this message originated from this very script, it should be ignored
      if (msg.data.sourceId !== sourceId) cleanup();
    }
  }

  function cleanup() {
    window.removeEventListener("message", handleMessage);

    if (window.__origHistoryPushState) {
      history.pushState = window.__origHistoryPushState;
      delete window.__origHistoryPushState;
    }

    if (window.__origHistoryReplaceState) {
      history.replaceState = window.__origHistoryReplaceState;
      delete window.__origHistoryReplaceState;
    }
  }

  function patchHistoryPushStateAndReplaceState() {
    window.__origHistoryPushState ??= history.pushState.bind(history);
    window.__origHistoryReplaceState ??= history.replaceState.bind(history);

    history.pushState = function (...args) {
      window.__origHistoryPushState!(...args);
      window.postMessage({ type: MessageType.urlChange } satisfies Message);
    };
    history.replaceState = function (...args) {
      window.__origHistoryReplaceState!(...args);
      window.postMessage({ type: MessageType.urlChange } satisfies Message);
    };
  }
})();
