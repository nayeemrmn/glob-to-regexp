// This module is ported from
// https://github.com/denoland/deno/blob/v1.2.2/std/path/_globrex_test.ts.
// Copyright 2018 Terkel Gjervig Nielsen. All rights reserved. MIT license.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.

import { GlobrexOptions, globrex } from "./_globrex.ts";
import { assert, assertEquals } from "./dev_deps.ts";

function match(
  glob: string,
  path: string,
  opts: GlobrexOptions = {},
): boolean {
  if (opts.os == null) {
    const matchDarwin = path.match(globrex(glob, { ...opts, os: "darwin" }));
    if (matchDarwin) {
      assertEquals(matchDarwin.length, 1);
    }
    const matchLinux = path.match(globrex(glob, { ...opts, os: "linux" }));
    if (matchLinux) {
      assertEquals(matchLinux.length, 1);
    }
    const matchWindows = path.match(globrex(glob, { ...opts, os: "windows" }));
    if (matchWindows) {
      assertEquals(matchWindows.length, 1);
    }
    return !!matchDarwin && !!matchLinux && !!matchWindows;
  } else {
    const match = path.match(globrex(glob, opts));
    if (match) {
      assertEquals(match.length, 1);
    }
    return !!match;
  }
}

Deno.test({
  name: "[globrex] Basic RegExp",
  fn(): void {
    assertEquals(globrex(""), /^$/);
    assertEquals(globrex("*.js", { os: "linux" }), /^[^/]*\.js\/*$/);
  },
});

Deno.test({
  name: "[globrex] * (wildcard)",
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
  name: "[globrex] ? (match one character)",
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
  name: "[globrex] [seq] (character range)",
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
  name: "[globrex] [[:alnum:]] (character class in range)",
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
      match(
        "[[:digit:]]/bar.txt",
        "1/bar.txt",
        { extended: false, globstar: false },
      ),
    );
    assert(
      match(
        "[[:digit:]b]/bar.txt",
        "b/bar.txt",
        { extended: false, globstar: false },
      ),
    );
    assert(
      match(
        "[![:digit:]b]/bar.txt",
        "a/bar.txt",
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
    assert(
      !match(
        "[[:digit:]]/bar.txt",
        "a/bar.txt",
        { extended: false, globstar: false },
      ),
    );
    assert(
      !match(
        "[[:digit:]b]/bar.txt",
        "a/bar.txt",
        { extended: false, globstar: false },
      ),
    );
  },
});

Deno.test({
  name: "[globrex] {} (brace expansion)",
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
  name: "[globrex] Complex matches",
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
  name: "[globrex] ** (globstar)",
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
  name: "[globrex] ?(pattern-list) (extended: match zero or one)",
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
  name: "[globrex] *(pattern-list) (extended: match zero or more)",
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
  name: "[globrex] +(pattern-list) (extended: match 1 or more)",
  fn(): void {
    assert(match("+(foo).txt", "foo.txt"));
    assert(!match("+(foo).txt", "foo.txt", { extended: false }));
    assert(match("+(foo).txt", "+(foo).txt", { extended: false }));
    assert(!match("+(foo).txt", ".txt"));
    assert(match("+(foo|bar).txt", "foobar.txt"));
  },
});

Deno.test({
  name: "[globrex] @(pattern-list) (extended: match one)",
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
  name: "[globrex] !(pattern-list) (extended: match any except)",
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
  name: "[globrex] Special extended characters should match themselves",
  fn(): void {
    const glob = "\\/$^+.()=!|,.*";
    assert(match(glob, glob));
    assert(match(glob, glob, { extended: false }));
  },
});

Deno.test({
  name: "[globrex] Special extended characters in range",
  fn(): void {
    assertEquals(globrex("[?*+@!|]", { os: "linux" }), /^[?*+@!|]\/*$/);
    assertEquals(globrex("[!?*+@!|]", { os: "linux" }), /^[^?*+@!|]\/*$/);
  },
});

Deno.test({
  name: "[globrex] Special RegExp characters in range",
  fn(): void {
    // Excluding characters checked in the previous test.
    assertEquals(globrex("[\\$^.=]", { os: "linux" }), /^[\\$^.=]\/*$/);
    assertEquals(globrex("[!\\$^.=]", { os: "linux" }), /^[^\\$^.=]\/*$/);
    assertEquals(globrex("[^^]", { os: "linux" }), /^[\^^]\/*$/);
  },
});

Deno.test({
  name: "[globrex] Repeating separators",
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
  name: "[globrex] Trailing separators",
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
  name: "[globrex] Backslashes on Windows",
  fn() {
    assert(match("foo/bar", "foo\\bar", { os: "windows" }));
    assert(match("foo\\bar", "foo/bar", { os: "windows" }));
    assert(match("foo\\bar", "foo\\bar", { os: "windows" }));
    assert(match("**/bar", "foo\\bar", { os: "windows" }));
    assert(match("**\\bar", "foo/bar", { os: "windows" }));
    assert(match("**\\bar", "foo\\bar", { os: "windows" }));
  },
});
