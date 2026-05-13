// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
import { render, h, Fragment } from "preact";
import PageControlPanel from "./PageControlPanel/PageControlPanel";

const sidecarClassName = "sift-sidecar";

export function addSidecar() {
  const siftSidecar = document.createElement("div");
  siftSidecar.classList.add(sidecarClassName);
  siftSidecar.style = `
    position: fixed;
    bottom: 32px;
    right: 32px;
  `;
  document.body.appendChild(siftSidecar);
  render(<PageControlPanel className="sift-page-control-panel" />, siftSidecar);
}

export function removeSidecar() {
  const siftSidecar = document.querySelector(`.${sidecarClassName}`);
  if (siftSidecar) document.body.removeChild(siftSidecar);
}
