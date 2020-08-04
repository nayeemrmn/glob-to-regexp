// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.

import { assertEquals } from "./dev_deps.ts";
import { globToRegExp } from "./mod.ts";

Deno.test({
  name: "GlobToRegExpOptions::extended",
  fn() {
    const pattern1 = globToRegExp("?(foo|bar)");
    assertEquals("foo".match(pattern1)?.[0], "foo");
    assertEquals("bar".match(pattern1)?.[0], "bar");

    const pattern2 = globToRegExp("?(foo|bar)", { extended: false });
    assertEquals("foo".match(pattern2)?.[0], undefined);
    assertEquals("bar".match(pattern2)?.[0], undefined);
    assertEquals("?(foo|bar)".match(pattern2)?.[0], "?(foo|bar)");
  },
});

Deno.test({
  name: "GlobToRegExpOptions::globstar",
  fn() {
    const pattern1 = globToRegExp("**/foo");
    assertEquals("foo".match(pattern1)?.[0], "foo");
    assertEquals("path/to/foo".match(pattern1)?.[0], "path/to/foo");

    const pattern2 = globToRegExp("**/foo", { globstar: false });
    assertEquals("foo".match(pattern2)?.[0], undefined);
    assertEquals("path/to/foo".match(pattern2)?.[0], undefined);
    assertEquals("path-to/foo".match(pattern2)?.[0], "path-to/foo");
  },
});

Deno.test({
  name: "GlobToRegExpOptions::os",
  fn() {
    const pattern1 = globToRegExp("foo/bar", { os: "linux" });
    assertEquals("foo/bar".match(pattern1)?.[0], "foo/bar");
    assertEquals("foo\\bar".match(pattern1)?.[0], undefined);

    const pattern2 = globToRegExp("foo/bar", { os: "windows" });
    assertEquals("foo/bar".match(pattern2)?.[0], "foo/bar");
    assertEquals("foo\\bar".match(pattern2)?.[0], "foo\\bar");
  },
});
