patchHistoryPushStateAndReplaceState();

function patchHistoryPushStateAndReplaceState() {
  const { pushState, replaceState } = history;
  history.pushState = function (...args) {
    pushState.apply(history, args);
    window.postMessage(`sift: urlchange`);
  };
  history.replaceState = function (...args) {
    replaceState.apply(history, args);
    window.postMessage(`sift: urlchange`);
  };
}
