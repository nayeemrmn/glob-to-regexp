// This module is ported from
// https://github.com/denoland/deno/blob/v1.2.2/std/path/glob.ts.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.
// This module is browser compatible.

import { globrex } from "./_globrex.ts";

export interface GlobToRegExpOptions {
  /** Extended glob syntax.
   * See https://www.linuxjournal.com/content/bash-extended-globbing. Defaults
   * to true. */
  extended?: boolean;
  /** Globstar syntax.
   * See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
   * If false, `**` is treated like `*`. Defaults to true. */
  globstar?: boolean;
}

/** Convert a glob string to a regular expressions. */
export function globToRegExp(
  glob: string,
  { extended = true, globstar = true }: GlobToRegExpOptions = {},
): RegExp {
  const result = globrex(glob, {
    extended,
    globstar,
    strict: false,
    filepath: true,
  });
  if (result.path == null) {
    throw new Error(`Assertion failure: "result.path != null"`);
  }
  return result.path.regex;
}
