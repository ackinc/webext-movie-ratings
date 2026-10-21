// The primary utility of the functions in this module is to prevent
//   user interactions with Sift's DOM elements from causing the webpage's
//   on-hover program nodes to disappear

const targetEventTypes = [
  "mousemove",
  "mouseout",
  "mouseover",
  "pointerout",
  "focusout",
  "visibilitychange",
] as const;

const siftBlockFlag = Symbol.for("sift:blockEventsOnWebpage");

export function blockEvents() {
  if (siftBlockFlag in EventTarget.prototype) return;

  targetEventTypes.forEach((et) =>
    window.addEventListener(et, hijackEvent, { capture: true, passive: false }),
  );
  Object.defineProperty(EventTarget.prototype, siftBlockFlag, {
    value: true,
    configurable: true, // allows deletion later
    enumerable: false,
    writable: false,
  });
  console.debug("EVENT LISTENERS BLOCKED");
}

export function unblockEvents() {
  if (!(siftBlockFlag in EventTarget.prototype)) return;

  targetEventTypes.forEach((et) =>
    window.removeEventListener(et, hijackEvent, true),
  );
  delete EventTarget.prototype[siftBlockFlag];
  console.debug("EVENT LISTENERS UNBLOCKED");
}

function hijackEvent(e: Event) {
  e.preventDefault();
  e.stopImmediatePropagation();
}
