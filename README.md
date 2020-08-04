# `glob-to-regexp`

Convert glob strings to regular expressions.

## Usage

```ts
import { globToRegExp } from "https://raw.githubusercontent.com/nayeemrmn/glob-to-regexp/v0.2.1/mod.ts";

const pattern1 = globToRegExp("**/?(foo|bar)");
console.log("foo".match(pattern1) != null); // true
console.log("path/to/bar".match(pattern1) != null); // true

const pattern2 = globToRegExp("**/?(foo|bar)", { extended: false });
console.log("foo".match(pattern2) != null); // false
console.log("path/to/foo".match(pattern2) != null); // false
console.log("**/?(foo|bar)".match(pattern2) != null); // true
```

## Attribution

The core of this module was originally ported from
https://github.com/terkelg/globrex/tree/v0.1.2 to
https://github.com/denoland/deno/blob/v1.2.2/std/path/_globrex.ts. I've brought
it here to iterate on it a bit before potentially porting it to Rust (in a
different repo).
