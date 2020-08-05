// This module is ported from
// https://github.com/denoland/deno/blob/v1.2.2/std/path/_globrex.ts.
// Copyright 2018 Terkel Gjervig Nielsen. All rights reserved. MIT license.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.
// This module is browser compatible.

import { nativeOs } from "./_util.ts";

export interface GlobrexOptions {
  /** Extended glob syntax.
   * See https://www.linuxjournal.com/content/bash-extended-globbing. Defaults
   * to true. */
  extended?: boolean;
  /** Globstar syntax.
   * See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
   * If false, `**` is treated like `*`. Defaults to true. */
  globstar?: boolean;
  /** Operating system. Defaults to the native OS. */
  os?: typeof Deno.build.os;
}

/** Convert a glob string to a regular expressions. */
export function globrex(
  glob: string,
  {
    extended = true,
    globstar: globstarOption = true,
    os = nativeOs,
  }: GlobrexOptions = {},
): RegExp {
  const sep = os == "windows" ? `(?:\\\\|\\/)+` : `\\/+`;
  const seps = os == "windows" ? ["\\", "/"] : ["/"];
  const sepRaw = os == "windows" ? `\\` : `/`;
  const globstar = os == "windows"
    ? `(?:[^\\\\/]*(?:\\\\|\\/|$)+)*`
    : `(?:[^/]*(?:\\/|$)+)*`;
  const wildcard = os == "windows" ? `[^\\\\/]*` : `[^/]*`;

  // Keep track of scope for extended syntaxes.
  const extStack = [];

  // If we are doing extended matching, this boolean is true when we are inside
  // a group (eg {*.html,*.js}), and false otherwise.
  let inGroup = false;
  let inRange = false;

  let regExpString = "";

  let c, n;
  for (let i = 0; i < glob.length; i++) {
    c = glob[i];
    n = glob[i + 1];

    if (seps.includes(c)) {
      regExpString += sep;
      while (seps.includes(glob[i + 1])) i++;
      continue;
    }

    if (c == "[") {
      if (inRange && n == ":") {
        i++; // skip [
        let value = "";
        while (glob[++i] !== ":") value += glob[i];
        if (value == "alnum") regExpString += "\\w\\d";
        else if (value == "space") regExpString += "\\s";
        else if (value == "digit") regExpString += "\\d";
        i++; // skip last ]
        continue;
      }
      inRange = true;
      regExpString += c;
      continue;
    }

    if (c == "]") {
      inRange = false;
      regExpString += c;
      continue;
    }

    if (c == "!") {
      if (inRange) {
        if (glob[i - 1] == "[") {
          regExpString += "^";
          continue;
        }
      } else if (extended) {
        if (n == "(") {
          extStack.push(c);
          regExpString += "(?!";
          i++;
          continue;
        }
        regExpString += `\\${c}`;
        continue;
      } else {
        regExpString += `\\${c}`;
        continue;
      }
    }

    if (inRange) {
      if (c == "\\" || c == "^" && glob[i - 1] == "[") regExpString += `\\${c}`;
      else regExpString += c;
      continue;
    }

    if (["\\", "$", "^", ".", "="].includes(c)) {
      regExpString += `\\${c}`;
      continue;
    }

    if (c == "(") {
      if (extStack.length) {
        regExpString += `${c}?:`;
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }

    if (c == ")") {
      if (extStack.length) {
        regExpString += c;
        const type = extStack.pop()!;
        if (type == "@") {
          regExpString += "{1}";
        } else if (type == "!") {
          regExpString += wildcard;
        } else {
          regExpString += type;
        }
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }

    if (c == "|") {
      if (extStack.length) {
        regExpString += c;
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }

    if (c == "+") {
      if (n == "(" && extended) {
        extStack.push(c);
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }

    if (c == "@" && extended) {
      if (n == "(") {
        extStack.push(c);
        continue;
      }
    }

    if (c == "?") {
      if (extended) {
        if (n == "(") {
          extStack.push(c);
        }
        continue;
      } else {
        regExpString += ".";
        continue;
      }
    }

    if (c == "{") {
      inGroup = true;
      regExpString += "(?:";
      continue;
    }

    if (c == "}") {
      inGroup = false;
      regExpString += ")";
      continue;
    }

    if (c == ",") {
      if (inGroup) {
        regExpString += "|";
        continue;
      }
      regExpString += `\\${c}`;
      continue;
    }

    if (c == "*") {
      if (n == "(" && extended) {
        extStack.push(c);
        continue;
      }
      // Move over all consecutive "*"'s.
      // Also store the previous and next characters
      const prevChar = glob[i - 1];
      let starCount = 1;
      while (glob[i + 1] == "*") {
        starCount++;
        i++;
      }
      const nextChar = glob[i + 1];
      const isGlobstar = globstarOption && starCount > 1 &&
        // from the start of the segment
        [sepRaw, "/", undefined].includes(prevChar) &&
        // to the end of the segment
        [sepRaw, "/", undefined].includes(nextChar);
      if (isGlobstar) {
        // it's a globstar, so match zero or more path segments
        regExpString += globstar;
        while (seps.includes(glob[i + 1])) i++;
      } else {
        // it's not a globstar, so only match one path segment
        regExpString += wildcard;
      }
      continue;
    }

    regExpString += c;
  }

  regExpString = `^${regExpString}$`;
  return new RegExp(regExpString);
}
