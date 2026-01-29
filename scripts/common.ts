// Ideally, we'd import these functions wherever they are needed from
//   'src/common/utils.ts', where they are already defined. However:
// - when using node's native TS support, importing them from
//   'src/common/utils.ts' fails because node requires file extensions
//   to be specified for all imports, and utils.ts itself imports other
//   files without specifying their extensions (no files inside src are
//   written with extensions specified in import statements)
// - when using the tsx tool, which doesn't require extensions to be specified
//   in imports, we still run into errors because utils.ts imports other files
//   that expect to be running in the browser, where 'chrome' is defined in
//   the global scope
// Since I don't want to remove the invariant that code inside 'src' is running
//   inside the browser, I've decided that the best way forward for now is to
//   duplicate the functions and associated type definitions here

export async function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type IsOptional = boolean;
export function pick(
  obj: Record<string, unknown>,
  keys: string[] | Record<string, IsOptional>,
  defaultRequired: boolean = false,
): Record<string, unknown> {
  if (Array.isArray(keys))
    keys = keys.reduce((acc, k) => ({ ...acc, [k]: defaultRequired }), {});

  const retval: Record<string, unknown> = {};

  for (const k in keys) {
    const isRequired = keys[k];

    if (!(k in obj) && isRequired)
      throw new Error(`Required key ${k} is absent`);

    retval[k] = obj[k];
  }

  return retval;
}
