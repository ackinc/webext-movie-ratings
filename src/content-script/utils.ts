import { CssClasses } from "../common";
import type { ProgramFilterSettings } from "../common";

export function makeFilteredOutProgramNodeStylesClause(
  filterSettings: ProgramFilterSettings
): string {
  const { transparency } = filterSettings;
  const opacity = 1 - transparency / 100;

  return `
.${CssClasses.filteredOutProgramNode} {
  display: block;
  opacity: ${opacity};
}
  `.trim();
}

export function updateFilteredOutProgramNodeStyles(
  filterSettings: ProgramFilterSettings
): void {
  const styleNode = document.querySelector(
    `style.${CssClasses.styleNode}`
  ) as HTMLElement;

  const fopnRegexp = new RegExp(
    `\\.${CssClasses.filteredOutProgramNode}{.+?}`,
    "s"
  );

  styleNode.textContent = [
    styleNode.textContent.replace(fopnRegexp, "").trim(),
    makeFilteredOutProgramNodeStylesClause(filterSettings),
  ].join("\n");
}
