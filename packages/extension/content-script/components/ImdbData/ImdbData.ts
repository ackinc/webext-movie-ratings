import { getIMDBLink, type IMDBData } from "@common";
import markup from "./imdbData.template.html";
import styles from "./imdbData.styles.css";

export default class ImdbData extends HTMLElement {
  #hidden = false;
  #expanded = false;

  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `<style>${styles}</style>${markup}`;

    const { imdbID: imdbId, imdbRating } = this.dataset as unknown as IMDBData;
    this.#hidden = imdbRating === "N/F";
    this.#render();

    shadowRoot?.addEventListener("mouseenter", () => {
      this.#expanded = true;
      this.#render();
    });
    shadowRoot?.addEventListener("mouseleave", () => {
      this.#expanded = false;
      this.#render();
    });

    const imdbLinkElem =
      shadowRoot.querySelector<HTMLLinkElement>(".rating-page-link")!;
    imdbLinkElem.href = getIMDBLink(imdbId);
    imdbLinkElem.textContent = `IMDb ${imdbRating === "N/A" ? "" : imdbRating}`;
    imdbLinkElem.addEventListener("click", (e) => e.stopPropagation());

    const maybeWrongButton = shadowRoot.querySelector<HTMLButtonElement>(
      ".maybe-wrong-button",
    )!;
    maybeWrongButton.addEventListener("click", () => {
      console.log("wut");
    });
  }

  #render() {
    const container = this.shadowRoot!.querySelector("div.sift-imdb-data")!;

    if (this.#hidden) {
      container.classList.add("hidden");
    } else {
      container.classList.remove("hidden");
    }

    if (this.#expanded) {
      container.classList.add("expanded");
    } else {
      container.classList.remove("expanded");
    }
  }
}
