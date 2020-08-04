// This module is ported from
// https://github.com/denoland/deno/blob/v1.2.2/std/path/_globrex.ts.
// Copyright 2018 Terkel Gjervig Nielsen. All rights reserved. MIT license.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.
// This module is browser compatible.

import { nativeOs } from "./_util.ts";

export interface GlobrexOptions {
  /** Allow ExtGlob features.
   * @default false */
  extended?: boolean;
  /** Support globstar.
   * @remarks When globstar is `true`, '/foo/**' is equivalent
   * to '/foo/*' when globstar is `false`.
   * Having globstar set to `true` is the same usage as
   * using wildcards in bash.
   * @default false */
  globstar?: boolean;
  /** Operating system.
   * @remarks When `"windows"`, `"\\"` is also a valid path separator. Defaults
   * to the native OS. */
  os?: typeof Deno.build.os;
}

/** Convert any glob pattern to a JavaScript Regexp object. */
export function globrex(
  glob: string,
  {
    extended = false,
    globstar = false,
    os: os_,
  }: GlobrexOptions = {},
): RegExp {
  const os = os_ ?? nativeOs;
  const SEP = os == "windows" ? `(?:\\\\|\\/)` : `\\/`;
  const SEP_RAW = os == "windows" ? `\\` : `/`;
  const GLOBSTAR = os == "windows"
    ? `(?:(?:[^\\\\/]*(?:\\\\|\\/|$))*)`
    : `(?:(?:[^/]*(?:\\/|$))*)`;
  const WILDCARD = os == "windows" ? `(?:[^\\\\/]*)` : `(?:[^/]*)`;

  const sepPattern = new RegExp(`^${SEP}+$`);
  let pathRegexStr = "";

  // If we are doing extended matching, this boolean is true when we are inside
  // a group (eg {*.html,*.js}), and false otherwise.
  let inGroup = false;
  let inRange = false;

  // extglob stack. Keep track of scope
  const ext = [];

  // Helper function to build string and segments
  function add(str: string): void {
    pathRegexStr += str.match(sepPattern) ? SEP : str;
  }

  let c, n;
  for (let i = 0; i < glob.length; i++) {
    c = glob[i];
    n = glob[i + 1];

    if (["\\", "$", "^", ".", "="].includes(c)) {
      add(`\\${c}`);
      continue;
    }

    if (c.match(sepPattern)) {
      add(SEP);
      continue;
    }

    if (c === "(") {
      if (ext.length) {
        add(`${c}?:`);
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === ")") {
      if (ext.length) {
        add(c);
        const type: string | undefined = ext.pop();
        if (type === "@") {
          add("{1}");
        } else if (type === "!") {
          add(WILDCARD);
        } else {
          add(type as string);
        }
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "|") {
      if (ext.length) {
        add(c);
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "+") {
      if (n === "(" && extended) {
        ext.push(c);
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "@" && extended) {
      if (n === "(") {
        ext.push(c);
        continue;
      }
    }

    if (c === "!") {
      if (extended) {
        if (inRange) {
          add("^");
          continue;
        }
        if (n === "(") {
          ext.push(c);
          add("(?!");
          i++;
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "?") {
      if (extended) {
        if (n === "(") {
          ext.push(c);
        } else {
          add(".");
        }
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "[") {
      if (inRange && n === ":") {
        i++; // skip [
        let value = "";
        while (glob[++i] !== ":") value += glob[i];
        if (value === "alnum") add("(?:\\w|\\d)");
        else if (value === "space") add("\\s");
        else if (value === "digit") add("\\d");
        i++; // skip last ]
        continue;
      }
      if (extended) {
        inRange = true;
        add(c);
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "]") {
      if (extended) {
        inRange = false;
        add(c);
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "{") {
      if (extended) {
        inGroup = true;
        add("(?:");
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "}") {
      if (extended) {
        inGroup = false;
        add(")");
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === ",") {
      if (inGroup) {
        add("|");
        continue;
      }
      add(`\\${c}`);
      continue;
    }

    if (c === "*") {
      if (n === "(" && extended) {
        ext.push(c);
        continue;
      }
      // Move over all consecutive "*"'s.
      // Also store the previous and next characters
      const prevChar = glob[i - 1];
      let starCount = 1;
      while (glob[i + 1] === "*") {
        starCount++;
        i++;
      }
      const nextChar = glob[i + 1];
      const isGlobstar = globstar && starCount > 1 &&
        // from the start of the segment
        [SEP_RAW, "/", undefined].includes(prevChar) &&
        // to the end of the segment
        [SEP_RAW, "/", undefined].includes(nextChar);
      if (isGlobstar) {
        // it's a globstar, so match zero or more path segments
        add(GLOBSTAR);
        i++; // move over the "/"
      } else {
        // it's not a globstar, so only match one path segment
        add(WILDCARD);
      }
      continue;
    }

    add(c);
  }

  pathRegexStr = `^${pathRegexStr}$`;

  return new RegExp(pathRegexStr);
}
