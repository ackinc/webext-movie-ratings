import {
  browser,
  clampNum,
  CssClasses,
  ErrorMessage,
  MessageType,
  omit,
  selectorStatusKeyPrefix,
  storage,
  type IMDBData,
  type Message,
  type Program,
  type ProgramData,
  type ProgramFilterSettings,
  type SelectorStatusForSite,
  type SWMessageResponse,
} from "../common";
import { SWError } from "../common/customErrors";

export function getFopnCssRules(
  filterSettings: ProgramFilterSettings,
): string[] {
  const { transparency } = filterSettings;
  const opacity = 1 - clampNum(transparency, 0, 100) / 100;

  return [
    `
.${CssClasses.filteredOutProgramNode} {
  opacity: ${opacity};
}
    `,
    `
.${CssClasses.filteredOutProgramNode}:hover {
  opacity: 1;
}
    `,
  ];
}

export function updateFilteredOutProgramNodeStyles(
  filterSettings: ProgramFilterSettings,
): void {
  const styleNode = document.querySelector<HTMLStyleElement>(
    `style.${CssClasses.styleNode}`,
  )!;
  const styleSheet = Array.from(document.styleSheets).find(
    (ss) => ss.ownerNode === styleNode,
  )!;
  const fopnRuleIndices = Array.from(styleSheet.cssRules).reduce(
    (acc, rule, idx) => {
      if (
        rule instanceof CSSStyleRule &&
        [
          `.${CssClasses.filteredOutProgramNode}`,
          `.${CssClasses.filteredOutProgramNode}:hover`,
        ].includes(rule.selectorText)
      ) {
        acc.push(idx);
      }
      return acc;
    },
    [] as number[],
  );
  // deleting in reverse order so target rules' indexes don't change
  //   during deletion
  fopnRuleIndices.reverse().forEach((idx) => styleSheet.deleteRule(idx));

  getFopnCssRules(filterSettings).forEach((rule) =>
    styleSheet.insertRule(rule),
  );

  styleNode.textContent = Array.from(styleSheet.cssRules)
    .map((rule) => rule.cssText)
    .join("\n\n");
}

export async function getSelectorStatusForCurrentSite(): Promise<SelectorStatusForSite> {
  const hostname = window.location.hostname;
  const selectorStatusKey = `${selectorStatusKeyPrefix}${hostname}`;
  const selectorStatusForSite =
    await storage.get<SelectorStatusForSite>(selectorStatusKey);
  return selectorStatusForSite ?? ({} as SelectorStatusForSite);
}

export async function setSelectorStatusForCurrentSite(
  updatedStatus: SelectorStatusForSite,
): Promise<void> {
  const hostname = window.location.hostname;
  const selectorStatusKey = `${selectorStatusKeyPrefix}${hostname}`;
  await storage.set(selectorStatusKey, updatedStatus);
}

export async function resetSelectorStatusForCurrentSite(): Promise<void> {
  await setSelectorStatusForCurrentSite({});
}

export function climbDOMUntil(
  startElem: HTMLElement,
  predFn: (node: HTMLElement) => boolean,
): HTMLElement | null {
  let cur: HTMLElement | null = startElem;
  do {
    if (predFn(cur)) break;
    cur = cur.parentElement;
  } while (cur);

  return cur;
}

export async function requestIMDBData(
  program: Program,
  timeoutInSeconds: number = 30,
): Promise<IMDBData> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(ErrorMessage.requestImdbDataTimedOut));
    }, timeoutInSeconds * 1000);

    try {
      browser.runtime
        .sendMessage<Message, SWMessageResponse<IMDBData>>({
          type: MessageType.fetchIMDBRating,
          data: {
            program: omit(program, ["node"]) as ProgramData,
            pageUrl: location.href,
          },
        } satisfies Message)
        .then((response) => {
          clearTimeout(timeout);
          if ("error" in response) reject(new SWError(response.error));
          else resolve(response.data);
        })
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}
