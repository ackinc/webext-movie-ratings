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
            program: rmCircularRefsFromProgram(program),
            pageUrl: location.href,
          },
        } satisfies Message)
        .then((response) => {
          clearTimeout(timeout);
          if ("error" in response) reject(new SWError(response.error));
          else resolve(response.data);
        })
        .catch(handleError);
    } catch (e) {
      handleError(e);
    }

    function handleError(e: unknown) {
      clearTimeout(timeout);

      const err = e instanceof Error ? e : new Error("Error", { cause: e });
      if (err instanceof TypeError && !browser.runtime) {
        reject(
          new Error(ErrorMessage.extensionRuntimeDisappeared, { cause: err }),
        );
      } else if (err.message.includes("message channel closed")) {
        reject(
          new Error(ErrorMessage.unexpectedMessageChannelClosure, {
            cause: err,
          }),
        );
      } else {
        reject(e);
      }
    }
  });
}

export function cssStyleSheetFromText(text: string) {
  const ss = new CSSStyleSheet();
  ss.replaceSync(text);
  return ss;
}

export function isVoidElement(elem: HTMLElement, except: string[] = []) {
  const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ]);
  const tagName = elem.tagName.toLowerCase();
  return (
    voidElements.has(tagName) &&
    !except.map((x) => x.toLowerCase()).includes(tagName)
  );
}

export function checkNodesOverlap(
  n1: HTMLElement,
  n2: HTMLElement,
  pxTolerance: number = 0,
): boolean {
  let rect1 = n1.getBoundingClientRect(),
    rect2 = n2.getBoundingClientRect();
  if (
    rect1.top > rect2.top ||
    (rect1.top === rect2.top && rect1.left > rect2.left)
  ) {
    const tmp = rect2;
    rect2 = rect1;
    rect1 = tmp;
  }

  // rect1 is always 'higher' in the viewport than rect2

  const bounds = {
    top: rect1.top - pxTolerance,
    bottom: rect1.bottom + pxTolerance,
    left: rect1.left - pxTolerance,
    right: rect1.right + pxTolerance,
  };

  return (
    rect2.top <= bounds.bottom &&
    ((rect2.left >= bounds.left && rect2.left <= bounds.right) ||
      (rect2.right >= bounds.left && rect2.right <= bounds.right) ||
      (rect2.left <= bounds.left && rect2.right >= bounds.right))
  );
}

// makes a deep-clone of program, with circular refs from inside
//   program.linked removed; this needs to be done before the program
//   can be sent to the service-worker via browser.runtime.sendMessage
export function rmCircularRefsFromProgram(program: Program): Program {
  return {
    ...omit(program, ["container", "linked"]),
    container: { ...program.container },
    ...(program.linked
      ? { linked: program.linked.map((p) => omit(p, ["linked"])) }
      : {}),
  };
}
