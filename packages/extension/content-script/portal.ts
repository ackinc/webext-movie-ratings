import { CssClasses } from "@common";

export function addPortal() {
  // used as a container for sift's modals
  // the shadow root helps us style our modals without worrying about the
  //   page's styles
  const portalDiv = document.createElement("div");
  portalDiv.classList.add(CssClasses.portal);
  portalDiv.attachShadow({ mode: "open" });
  document.body.appendChild(portalDiv);
}

export function removePortal() {
  const portal = document.querySelector(`.${CssClasses.portal}`);
  if (portal) portal.parentElement!.removeChild(portal);
}
