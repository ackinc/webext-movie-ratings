import { clampNum, CssClasses, storage } from "../common";
import type { ProgramFilterSettings, SelectorStatusForSite } from "../common";

export function makeFilteredOutProgramNodeStylesClause(
  filterSettings: ProgramFilterSettings,
): string {
  const { transparency } = filterSettings;
  const opacity = 1 - clampNum(transparency, 0, 100) / 100;

  return `
.${CssClasses.filteredOutProgramNode} {
  ${transparency > 100 ? `display: none;` : ""}
  opacity: ${opacity};
}
  `.trim();
}

export function updateFilteredOutProgramNodeStyles(
  filterSettings: ProgramFilterSettings,
): void {
  const styleNode = document.querySelector(
    `style.${CssClasses.styleNode}`,
  ) as HTMLElement;

  const fopnRegexp = new RegExp(
    `\\.${CssClasses.filteredOutProgramNode}\\s*{[^}]*?}`,
    "gs",
  );

  styleNode.textContent = [
    styleNode.textContent.replace(fopnRegexp, "").trim(),
    makeFilteredOutProgramNodeStylesClause(filterSettings),
  ].join("\n");
}

export async function getSelectorStatusForCurrentSite(): Promise<SelectorStatusForSite> {
  const hostname = window.location.hostname;
  const selectorStatusKey = `selectorStatus_${hostname}`;
  const selectorStatusForSite = ((await storage.get(selectorStatusKey)) ??
    {}) as SelectorStatusForSite;
  return selectorStatusForSite;
}

export async function setSelectorStatusForCurrentSite(
  updatedStatus: SelectorStatusForSite,
): Promise<void> {
  const hostname = window.location.hostname;
  const selectorStatusKey = `selectorStatus_${hostname}`;
  await storage.set(selectorStatusKey, updatedStatus);
}
