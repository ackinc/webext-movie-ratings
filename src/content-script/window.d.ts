import type AbstractPage from "./AbstractPage";

declare global {
  interface Window {
    __page: AbstractPage;
  }
}
