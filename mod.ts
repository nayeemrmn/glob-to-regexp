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
      if (!inRange) {
        inRange = true;
        regExpString += "[";
        if (glob[i + 1] == "!") {
          i++;
          regExpString += "^";
        } else if (glob[i + 1] == "^") {
          i++;
          regExpString += "\\^";
        }
        continue;
      } else if (glob[i + 1] == ":") {
        let j = i + 1;
        let value = "";
        while (glob[j + 1] != null && glob[j + 1] != ":") {
          value += glob[j + 1];
          j++;
        }
        if (glob[j + 1] == ":" && glob[j + 2] == "]") {
          i = j + 2;
          if (value == "alnum") regExpString += "\\dA-Za-z";
          else if (value == "alpha") regExpString += "A-Za-z";
          else if (value == "ascii") regExpString += "\x00-\x7F";
          else if (value == "blank") regExpString += "\t ";
          else if (value == "cntrl") regExpString += "\x00-\x1F\x7F";
          else if (value == "digit") regExpString += "\\d";
          else if (value == "graph") regExpString += "\x21-\x7E";
          else if (value == "lower") regExpString += "a-z";
          else if (value == "print") regExpString += "\x20-\x7E";
          else if (value == "punct") {
            regExpString += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
          } else if (value == "space") regExpString += "\\s\v";
          else if (value == "upper") regExpString += "A-Z";
          else if (value == "word") regExpString += "\\w";
          else if (value == "xdigit") regExpString += "\\dA-Fa-f";
          continue;
        }
      }
    }

    if (glob[i] == "]" && inRange) {
      inRange = false;
      regExpString += "]";
      continue;
    }

    if (inRange) {
      if (glob[i] == "\\") {
        regExpString += `\\\\`;
      } else {
        regExpString += glob[i];
      }
      continue;
    }

    if (glob[i] == ")" && extStack.length) {
      regExpString += ")";
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

    if (glob[i] == "|" && extStack.length > 0) {
      regExpString += "|";
      continue;
    }

    if (glob[i] == "+" && extended && glob[i + 1] == "(") {
      i++;
      extStack.push("+");
      regExpString += "(?:";
      continue;
    }

    if (glob[i] == "@" && extended && glob[i + 1] == "(") {
      i++;
      extStack.push("@");
      regExpString += "(?:";
      continue;
    }

    if (glob[i] == "?") {
      if (extended && glob[i + 1] == "(") {
        i++;
        extStack.push("?");
        regExpString += "(?:";
      } else {
        regExpString += ".";
      }
      continue;
    }

    if (glob[i] == "!" && extended && glob[i + 1] == "(") {
      i++;
      extStack.push("!");
      regExpString += "(?!";
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

    if (glob[i] == "," && inGroup) {
      regExpString += "|";
      continue;
    }

    if (glob[i] == "*") {
      if (extended && glob[i + 1] == "(") {
        i++;
        extStack.push("*");
        regExpString += "(?:";
      } else {
        const prevChar = glob[i - 1];
        let numStars = 1;
        while (glob[i + 1] == "*") {
          i++;
          numStars++;
        }
        const nextChar = glob[i + 1];
        if (
          globstarOption && numStars == 2 &&
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

    // deno-fmt-ignore
    if (["!", "$", "(", ")", "*", "+", ",", ".", "=", "?", "\\", "^", "{", "|", "}"].includes(glob[i])) {
      regExpString += `\\${glob[i]}`;
    } else {
      regExpString += glob[i];
    }
  }

  regExpString = `^${regExpString}${regExpString != "" ? sepMaybe : ""}$`;
  return new RegExp(regExpString);
}
