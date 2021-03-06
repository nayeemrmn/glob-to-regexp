// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.

import { assert, assertEquals } from "./dev_deps.ts";
import { globToRegExp } from "./mod.ts";
import type { GlobToRegExpOptions } from "./mod.ts";

function match(
  glob: string,
  path: string,
  opts: GlobToRegExpOptions = {},
): boolean {
  if (opts.os == null) {
    const matchDarwin = path.match(
      globToRegExp(glob, { ...opts, os: "darwin" }),
    );
    if (matchDarwin) {
      assertEquals(matchDarwin.length, 1);
    }
    const matchLinux = path.match(globToRegExp(glob, { ...opts, os: "linux" }));
    if (matchLinux) {
      assertEquals(matchLinux.length, 1);
    }
    const matchWindows = path.match(
      globToRegExp(glob, { ...opts, os: "windows" }),
    );
    if (matchWindows) {
      assertEquals(matchWindows.length, 1);
    }
    return !!matchDarwin && !!matchLinux && !!matchWindows;
  } else {
    const match = path.match(globToRegExp(glob, opts));
    if (match) {
      assertEquals(match.length, 1);
    }
    return !!match;
  }
}

Deno.test({
  name: "globToRegExp() Basic RegExp",
  fn(): void {
    assertEquals(globToRegExp("*.js", { os: "linux" }), /^[^/]*\.js\/*$/);
  },
});

Deno.test({
  name: "globToRegExp() Empty glob",
  fn(): void {
    assertEquals(globToRegExp(""), /(?!)/);
    assertEquals(globToRegExp("*.js", { os: "linux" }), /^[^/]*\.js\/*$/);
  },
});

Deno.test({
  name: "globToRegExp() * (wildcard)",
  fn(): void {
    assert(match("*", "foo", { extended: false, globstar: false }));
    assert(match("*", "foo", { extended: false, globstar: false }));
    assert(match("f*", "foo", { extended: false, globstar: false }));
    assert(match("f*", "foo", { extended: false, globstar: false }));
    assert(match("*o", "foo", { extended: false, globstar: false }));
    assert(match("*o", "foo", { extended: false, globstar: false }));
    assert(match("u*orn", "unicorn", { extended: false, globstar: false }));
    assert(match("u*orn", "unicorn", { extended: false, globstar: false }));
    assert(!match("ico", "unicorn", { extended: false, globstar: false }));
    assert(match("u*nicorn", "unicorn", { extended: false, globstar: false }));
    assert(match("u*nicorn", "unicorn", { extended: false, globstar: false }));
  },
});

Deno.test({
  name: "globToRegExp() ? (match one character)",
  fn(): void {
    assert(match("f?o", "foo", { extended: false, globstar: false }));
    assert(match("f?o?", "fooo", { extended: false, globstar: false }));
    assert(!match("f?oo", "foo", { extended: false, globstar: false }));
    assert(!match("?fo", "fooo", { extended: false, globstar: false }));
    assert(!match("f?oo", "foo", { extended: false, globstar: false }));
    assert(!match("foo?", "foo", { extended: false, globstar: false }));
  },
});

Deno.test({
  name: "globToRegExp() [seq] (character range)",
  fn(): void {
    assert(match("fo[oz]", "foo", { extended: false, globstar: false }));
    assert(match("fo[oz]", "foz", { extended: false, globstar: false }));
    assert(!match("fo[oz]", "fog", { extended: false, globstar: false }));
    assert(match("fo[a-z]", "fob", { extended: false, globstar: false }));
    assert(!match("fo[a-d]", "fot", { extended: false, globstar: false }));
    assert(!match("fo[!tz]", "fot", { extended: false, globstar: false }));
    assert(match("fo[!tz]", "fob", { extended: false, globstar: false }));
  },
});

Deno.test({
  name: "globToRegExp() [[:alnum:]] (character class in range)",
  fn(): void {
    assert(
      match(
        "[[:alnum:]]/bar.txt",
        "a/bar.txt",
        { extended: false, globstar: false },
      ),
    );
    assert(
      match(
        "[[:alnum:]abc]/bar.txt",
        "1/bar.txt",
        { extended: false, globstar: false },
      ),
    );
    assert(
      !match(
        "[[:alnum:]]/bar.txt",
        "!/bar.txt",
        { extended: false, globstar: false },
      ),
    );
    for (const c of "09AGZagz") {
      assert(match("[[:alnum:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "AGZagz") {
      assert(match("[[:alpha:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "\x00\x20\x7F") {
      assert(match("[[:ascii:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "\t ") {
      assert(match("[[:blank:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "\x00\x1F\x7F") {
      assert(match("[[:cntrl:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "09") {
      assert(match("[[:digit:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "\x21\x7E") {
      assert(match("[[:graph:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "az") {
      assert(match("[[:lower:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "\x20\x7E") {
      assert(match("[[:print:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "!\"#$%&'()*+,-./:;<=>?@[\\]^_‘{|}~") {
      assert(match("[[:punct:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "\t\n\v\f\r ") {
      assert(match("[[:space:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "AZ") {
      assert(match("[[:upper:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "09AZaz_") {
      assert(match("[[:word:]]", c, { extended: false, globstar: false }), c);
    }
    for (const c of "09AFaf") {
      assert(match("[[:xdigit:]]", c, { extended: false, globstar: false }), c);
    }
  },
});

Deno.test({
  name: "globToRegExp() {} (brace expansion)",
  fn(): void {
    assert(
      match("foo{bar,baaz}", "foobaaz", { extended: false, globstar: false }),
    );
    assert(
      match("foo{bar,baaz}", "foobar", { extended: false, globstar: false }),
    );
    assert(
      !match("foo{bar,baaz}", "foobuzz", { extended: false, globstar: false }),
    );
    assert(
      match("foo{bar,b*z}", "foobuzz", { extended: false, globstar: false }),
    );
  },
});

Deno.test({
  name: "globToRegExp() Complex matches",
  fn(): void {
    assert(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://foo.baaz.com/jquery.min.js",
        { extended: false, globstar: false },
      ),
    );
    assert(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.buzz.com/index.html",
        { extended: false, globstar: false },
      ),
    );
    assert(
      !match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.buzz.com/index.htm",
        { extended: false, globstar: false },
      ),
    );
    assert(
      !match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.bar.com/index.html",
        { extended: false, globstar: false },
      ),
    );
    assert(
      !match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://flozz.buzz.com/index.html",
        { extended: false, globstar: false },
      ),
    );
  },
});

Deno.test({
  name: "globToRegExp() ** (globstar)",
  fn(): void {
    assert(match("/foo/**", "/foo/bar.txt"));
    assert(match("/foo/**", "/foo/bar/baz.txt"));
    assert(!match("/foo/**", "/foo/bar/baz.txt", { globstar: false }));
    assert(match("/foo/**", "/foo/bar", { globstar: false }));
    assert(match("/foo/**/*.txt", "/foo/bar/baz.txt"));
    assert(match("/foo/**/*.txt", "/foo/bar/baz/qux.txt"));
    assert(match("/foo/**/bar.txt", "/foo/bar.txt"));
    assert(match("/foo/**/**/bar.txt", "/foo/bar.txt"));
    assert(match("/foo/**/*/baz.txt", "/foo/bar/baz.txt"));
    assert(match("/foo/**/*.txt", "/foo/bar.txt"));
    assert(match("/foo/**/**/*.txt", "/foo/bar.txt"));
    assert(match("/foo/**/*/*.txt", "/foo/bar/baz.txt"));
    assert(match("**/*.txt", "/foo/bar/baz/qux.txt"));
    assert(match("**/foo.txt", "foo.txt"));
    assert(match("**/*.txt", "foo.txt"));
    assert(!match("/foo/**.txt", "/foo/bar/baz/qux.txt"));
    assert(
      !match("/foo/bar**/*.txt", "/foo/bar/baz/qux.txt"),
    );
    assert(!match("/foo/bar**", "/foo/bar/baz.txt"));
    assert(!match("**/.txt", "/foo/bar/baz/qux.txt"));
    assert(
      !match(
        "http://foo.com/*",
        "http://foo.com/bar/baz/jquery.min.js",
      ),
    );
    assert(
      !match("http://foo.com/*", "http://foo.com/bar/baz/jquery.min.js"),
    );
    assert(
      match("http://foo.com/**", "http://foo.com/bar/baz/jquery.min.js"),
    );
    assert(
      match(
        "http://foo.com/**/jquery.min.js",
        "http://foo.com/bar/baz/jquery.min.js",
      ),
    );
    assert(
      !match(
        "http://foo.com/*/jquery.min.js",
        "http://foo.com/bar/baz/jquery.min.js",
      ),
    );
  },
});

Deno.test({
  name: "globToRegExp() ?(pattern-list) (extended: match zero or one)",
  fn(): void {
    assert(match("?(foo).txt", "foo.txt"));
    assert(!match("?(foo).txt", "foo.txt", { extended: false }));
    assert(match("?(foo).txt", "a(foo).txt", { extended: false }));
    assert(match("?(foo).txt", ".txt"));
    assert(match("?(foo|bar)baz.txt", "foobaz.txt"));
    assert(match("?(ba[zr]|qux)baz.txt", "bazbaz.txt"));
    assert(match("?(ba[zr]|qux)baz.txt", "barbaz.txt"));
    assert(match("?(ba[zr]|qux)baz.txt", "quxbaz.txt"));
    assert(match("?(ba[!zr]|qux)baz.txt", "batbaz.txt"));
    assert(match("?(ba*|qux)baz.txt", "batbaz.txt"));
    assert(match("?(ba*|qux)baz.txt", "batttbaz.txt"));
    assert(match("?(ba*|qux)baz.txt", "quxbaz.txt"));
    assert(match("?(ba?(z|r)|qux)baz.txt", "bazbaz.txt"));
    assert(match("?(ba?(z|?(r))|qux)baz.txt", "bazbaz.txt"));
    assert(!match("?(foo|bar)baz.txt", "foobarbaz.txt"));
    assert(!match("?(ba[zr]|qux)baz.txt", "bazquxbaz.txt"));
    assert(!match("?(ba[!zr]|qux)baz.txt", "bazbaz.txt"));
  },
});

Deno.test({
  name: "globToRegExp() *(pattern-list) (extended: match zero or more)",
  fn(): void {
    assert(match("*(foo).txt", "foo.txt"));
    assert(!match("*(foo).txt", "foo.txt", { extended: false }));
    assert(match("*(foo).txt", "bar(foo).txt", { extended: false }));
    assert(match("*(foo).txt", "foofoo.txt"));
    assert(match("*(foo).txt", ".txt"));
    assert(match("*(fooo).txt", ".txt"));
    assert(!match("*(fooo).txt", "foo.txt"));
    assert(match("*(foo|bar).txt", "foobar.txt"));
    assert(match("*(foo|bar).txt", "barbar.txt"));
    assert(match("*(foo|bar).txt", "barfoobar.txt"));
    assert(match("*(foo|bar).txt", ".txt"));
    assert(match("*(foo|ba[rt]).txt", "bat.txt"));
    assert(match("*(foo|b*[rt]).txt", "blat.txt"));
    assert(!match("*(foo|b*[rt]).txt", "tlat.txt"));
    assert(match("*(*).txt", "whatever.txt"));
    assert(match("*(foo|bar)/**/*.txt", "foo/hello/world/bar.txt"));
    assert(match("*(foo|bar)/**/*.txt", "foo/world/bar.txt"));
  },
});

Deno.test({
  name: "globToRegExp() +(pattern-list) (extended: match 1 or more)",
  fn(): void {
    assert(match("+(foo).txt", "foo.txt"));
    assert(!match("+(foo).txt", "foo.txt", { extended: false }));
    assert(match("+(foo).txt", "+(foo).txt", { extended: false }));
    assert(!match("+(foo).txt", ".txt"));
    assert(match("+(foo|bar).txt", "foobar.txt"));
  },
});

Deno.test({
  name: "globToRegExp() @(pattern-list) (extended: match one)",
  fn(): void {
    assert(match("@(foo).txt", "foo.txt"));
    assert(!match("@(foo).txt", "foo.txt", { extended: false }));
    assert(match("@(foo).txt", "@(foo).txt", { extended: false }));
    assert(match("@(foo|baz)bar.txt", "foobar.txt"));
    assert(!match("@(foo|baz)bar.txt", "foobazbar.txt"));
    assert(!match("@(foo|baz)bar.txt", "foofoobar.txt"));
    assert(!match("@(foo|baz)bar.txt", "toofoobar.txt"));
  },
});

Deno.test({
  name: "globToRegExp() !(pattern-list) (extended: match any except)",
  fn(): void {
    assert(match("!(boo).txt", "foo.txt"));
    assert(!match("!(boo).txt", "foo.txt", { extended: false }));
    assert(match("!(boo).txt", "!(boo).txt", { extended: false }));
    assert(match("!(foo|baz)bar.txt", "buzbar.txt"));
    assert(match("!({foo,bar})baz.txt", "notbaz.txt"));
    assert(!match("!({foo,bar})baz.txt", "foobaz.txt"));
  },
});

Deno.test({
  name: "globToRegExp() Special extended characters should match themselves",
  fn(): void {
    const glob = "\\/$^+.()=!|,.*";
    assert(match(glob, glob));
    assert(match(glob, glob, { extended: false }));
  },
});

Deno.test({
  name: "globToRegExp() Special extended characters in range",
  fn(): void {
    assertEquals(globToRegExp("[?*+@!|]", { os: "linux" }), /^[?*+@!|]\/*$/);
    assertEquals(globToRegExp("[!?*+@!|]", { os: "linux" }), /^[^?*+@!|]\/*$/);
  },
});

Deno.test({
  name: "globToRegExp() Special RegExp characters in range",
  fn(): void {
    // Excluding characters checked in the previous test.
    assertEquals(globToRegExp("[\\\\$^.=]", { os: "linux" }), /^[\\$^.=]\/*$/);
    assertEquals(
      globToRegExp("[!\\\\$^.=]", { os: "linux" }),
      /^[^\\$^.=]\/*$/,
    );
    assertEquals(globToRegExp("[^^]", { os: "linux" }), /^[\^^]\/*$/);
  },
});

Deno.test({
  name: "globToRegExp() Repeating separators",
  fn() {
    assert(match("foo/bar", "foo//bar"));
    assert(match("foo//bar", "foo/bar"));
    assert(match("foo//bar", "foo//bar"));
    assert(match("**/bar", "foo//bar"));
    assert(match("**//bar", "foo/bar"));
    assert(match("**//bar", "foo//bar"));
  },
});

Deno.test({
  name: "globToRegExp() Trailing separators",
  fn() {
    assert(match("foo", "foo/"));
    assert(match("foo/", "foo"));
    assert(match("foo/", "foo/"));
    assert(match("**", "foo/"));
    assert(match("**/", "foo"));
    assert(match("**/", "foo/"));
  },
});

Deno.test({
  name: "globToRegExp() Backslashes on Windows",
  fn() {
    assert(match("foo/bar", "foo\\bar", { os: "windows" }));
    assert(match("foo\\bar", "foo/bar", { os: "windows" }));
    assert(match("foo\\bar", "foo\\bar", { os: "windows" }));
    assert(match("**/bar", "foo\\bar", { os: "windows" }));
    assert(match("**\\bar", "foo/bar", { os: "windows" }));
    assert(match("**\\bar", "foo\\bar", { os: "windows" }));
  },
});

Deno.test({
  name: "globToRegExp() Unclosed groups",
  fn() {
    assert(match("{foo,bar}/[ab", "foo/[ab"));
    assert(match("{foo,bar}/{foo,bar", "foo/{foo,bar"));
    assert(match("{foo,bar}/?(foo|bar", "foo/?(foo|bar"));
    assert(match("{foo,bar}/@(foo|bar", "foo/@(foo|bar"));
    assert(match("{foo,bar}/*(foo|bar", "foo/*(foo|bar"));
    assert(match("{foo,bar}/+(foo|bar", "foo/+(foo|bar"));
    assert(match("{foo,bar}/!(foo|bar", "foo/!(foo|bar"));
    assert(match("{foo,bar}/?({)}", "foo/?({)}"));
    assert(match("{foo,bar}/{?(})", "foo/{?(})"));
  },
});

Deno.test({
  name: "globToRegExp() Escape glob characters",
  fn() {
    assert(match("\\[ab]", "[ab]", { os: "linux" }));
    assert(match("`[ab]", "[ab]", { os: "windows" }));
    assert(match("\\{foo,bar}", "{foo,bar}", { os: "linux" }));
    assert(match("`{foo,bar}", "{foo,bar}", { os: "windows" }));
    assert(match("\\?(foo|bar)", "?(foo|bar)", { os: "linux" }));
    assert(match("`?(foo|bar)", "?(foo|bar)", { os: "windows" }));
    assert(match("\\@(foo|bar)", "@(foo|bar)", { os: "linux" }));
    assert(match("`@(foo|bar)", "@(foo|bar)", { os: "windows" }));
    assert(match("\\*(foo|bar)", "*(foo|bar)", { os: "linux" }));
    assert(match("`*(foo|bar)", "*(foo|bar)", { os: "windows" }));
    assert(match("\\+(foo|bar)", "+(foo|bar)", { os: "linux" }));
    assert(match("`+(foo|bar)", "+(foo|bar)", { os: "windows" }));
    assert(match("\\!(foo|bar)", "!(foo|bar)", { os: "linux" }));
    assert(match("`!(foo|bar)", "!(foo|bar)", { os: "windows" }));
    assert(match("@\\(foo|bar)", "@(foo|bar)", { os: "linux" }));
    assert(match("@`(foo|bar)", "@(foo|bar)", { os: "windows" }));
    assert(match("{foo,bar}/[ab]\\", "foo/[ab]\\", { os: "linux" }));
    assert(match("{foo,bar}/[ab]`", "foo/[ab]`", { os: "windows" }));
  },
});

Deno.test({
  name: "globToRegExp() Dangling escape prefix",
  fn() {
    assert(match("{foo,bar}/[ab]\\", "foo/[ab]\\", { os: "linux" }));
    assert(match("{foo,bar}/[ab]`", "foo/[ab]`", { os: "windows" }));
  },
});

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
