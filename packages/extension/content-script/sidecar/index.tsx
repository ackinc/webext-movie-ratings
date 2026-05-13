// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
import { render, h, Fragment } from "preact";
import type AbstractPage from "../AbstractPage";
import PageControlPanel from "./PageControlPanel";

const sidecarClassName = "sift-sidecar";

export function addSidecar({ page }: { page: AbstractPage }) {
  const siftSidecar = document.createElement("div");
  siftSidecar.classList.add(sidecarClassName);
  siftSidecar.style = `
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 1000;
  `;
  document.body.appendChild(siftSidecar);
  render(
    <PageControlPanel className="sift-page-control-panel" page={page} />,
    siftSidecar,
  );
}

export function removeSidecar() {
  const siftSidecar = document.querySelector(`.${sidecarClassName}`);
  if (siftSidecar) document.body.removeChild(siftSidecar);
}
