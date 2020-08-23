// This module is ported from
// https://github.com/denoland/deno/blob/v1.2.2/std/path/glob.ts.
// Copyright 2018 Terkel Gjervig Nielsen. All rights reserved. MIT license.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.
// This module is browser compatible.

import { nativeOs } from "./_util.ts";

export interface GlobToRegExpOptions {
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
export function globToRegExp(
  glob: string,
  { extended = true, globstar: globstarOption = true, os = nativeOs }:
    GlobToRegExpOptions = {},
): RegExp {
  const sep = os == "windows" ? `(?:\\\\|/)+` : `/+`;
  const sepMaybe = os == "windows" ? `(?:\\\\|/)*` : `/*`;
  const seps = os == "windows" ? ["\\", "/"] : ["/"];
  const globstar = os == "windows"
    ? `(?:[^\\\\/]*(?:\\\\|/|$)+)*`
    : `(?:[^/]*(?:/|$)+)*`;
  const wildcard = os == "windows" ? `[^\\\\/]*` : `[^/]*`;

  // Keep track of scope for extended syntaxes.
  const extStack = [];

  // If we are doing extended matching, this boolean is true when we are inside
  // a group (eg {*.html,*.js}), and false otherwise.
  let inGroup = false;
  let inRange = false;

  let regExpString = "";

  // Remove trailing separators.
  let newLength = glob.length;
  for (; newLength > 0 && seps.includes(glob[newLength - 1]); newLength--);
  glob = glob.slice(0, newLength);

  for (let i = 0; i < glob.length; i++) {
    if (seps.includes(glob[i])) {
      regExpString += sep;
      while (seps.includes(glob[i + 1])) i++;
      continue;
    }

    if (glob[i] == "[") {
      if (inRange && glob[i + 1] == ":") {
        i++; // skip [
        let value = "";
        while (glob[++i] !== ":") value += glob[i];
        if (value == "alnum") regExpString += "\\w\\d";
        else if (value == "space") regExpString += "\\s";
        else if (value == "digit") regExpString += "\\d";
        i++; // skip last ]
      } else {
        inRange = true;
        regExpString += "[";
      }
      continue;
    }

    if (glob[i] == "]") {
      inRange = false;
      regExpString += "]";
      continue;
    }

    if (glob[i] == "!") {
      if (inRange) {
        if (glob[i - 1] == "[") {
          regExpString += "^";
          continue;
        }
      } else if (extended) {
        if (glob[i + 1] == "(") {
          extStack.push("!");
          regExpString += "(?!";
          i++;
        } else {
          regExpString += "\\!";
        }
        continue;
      } else {
        regExpString += "\\!";
        continue;
      }
    }

    if (inRange) {
      if (glob[i] == "\\" || glob[i] == "^" && glob[i - 1] == "[") {
        regExpString += `\\${glob[i]}`;
      } else regExpString += glob[i];
      continue;
    }

    if (["\\", "$", "^", ".", "="].includes(glob[i])) {
      regExpString += `\\${glob[i]}`;
      continue;
    }

    if (glob[i] == "(") {
      if (extStack.length) {
        regExpString += "(?:";
        continue;
      }
      regExpString += "\\(";
      continue;
    }

    if (glob[i] == ")") {
      if (extStack.length) {
        regExpString += ")";
        const type = extStack.pop()!;
        if (type == "@") {
          regExpString += "{1}";
        } else if (type == "!") {
          regExpString += wildcard;
        } else {
          regExpString += type;
        }
      } else {
        regExpString += "\\)";
      }
      continue;
    }

    if (glob[i] == "|") {
      if (extStack.length) {
        regExpString += "|";
      } else {
        regExpString += "\\|";
      }
      continue;
    }

    if (glob[i] == "+") {
      if (extended && glob[i + 1] == "(") {
        extStack.push("+");
      } else {
        regExpString += "\\+";
      }
      continue;
    }

    if (extended && glob[i] == "@" && glob[i + 1] == "(") {
      extStack.push("@");
      continue;
    }

    if (glob[i] == "?") {
      if (extended && glob[i + 1] == "(") {
        extStack.push("?");
      } else {
        regExpString += ".";
      }
      continue;
    }

    if (glob[i] == "{") {
      inGroup = true;
      regExpString += "(?:";
      continue;
    }

    if (glob[i] == "}") {
      inGroup = false;
      regExpString += ")";
      continue;
    }

    if (glob[i] == ",") {
      if (inGroup) {
        regExpString += "|";
      } else {
        regExpString += "\\,";
      }
      continue;
    }

    if (glob[i] == "*") {
      if (extended && glob[i + 1] == "(") {
        extStack.push("*");
      } else {
        const prevChar = glob[i - 1];
        let starCount = 1;
        while (glob[i + 1] == "*") {
          starCount++;
          i++;
        }
        const nextChar = glob[i + 1];
        if (
          globstarOption && starCount > 1 &&
          [...seps, undefined].includes(prevChar) &&
          [...seps, undefined].includes(nextChar)
        ) {
          regExpString += globstar;
          while (seps.includes(glob[i + 1])) i++;
        } else {
          regExpString += wildcard;
        }
      }
      continue;
    }

    regExpString += glob[i];
  }

  regExpString = `^${regExpString}${regExpString != "" ? sepMaybe : ""}$`;
  return new RegExp(regExpString);
}
