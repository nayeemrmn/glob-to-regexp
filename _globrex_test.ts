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
    assertEquals(globrex("*.js"), /^[^/]*\.js$/);
  },
});

Deno.test({
  name: "[globrex] * (wildcard)",
  fn(): void {
    assert(match("*", "foo"));
    assert(match("*", "foo"));
    assert(match("f*", "foo"));
    assert(match("f*", "foo"));
    assert(match("*o", "foo"));
    assert(match("*o", "foo"));
    assert(match("u*orn", "unicorn"));
    assert(match("u*orn", "unicorn"));
    assert(!match("ico", "unicorn"));
    assert(match("u*nicorn", "unicorn"));
    assert(match("u*nicorn", "unicorn"));
  },
});

Deno.test({
  name: "[globrex] ? (match one character)",
  fn(): void {
    assert(match("f?o", "foo", { extended: true }));
    assert(!match("f?o", "fooo", { extended: true }));
    assert(!match("f?oo", "foo", { extended: true }));

    const tester = (globstar: boolean): void => {
      assert(match("f?o", "foo", { extended: true, globstar }));
      assert(match("f?o?", "fooo", { extended: true, globstar }));

      assert(!match("f?o", "fooo", { extended: true, globstar }));
      assert(!match("?fo", "fooo", { extended: true, globstar }));
      assert(!match("f?oo", "foo", { extended: true, globstar }));
      assert(!match("foo?", "foo", { extended: true, globstar }));
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "[globrex] [seq] (character range)",
  fn(): void {
    assert(match("fo[oz]", "foo", { extended: true }));
    assert(match("fo[oz]", "foz", { extended: true }));
    assert(!match("fo[oz]", "fog", { extended: true }));
    assert(match("fo[a-z]", "fob", { extended: true }));
    assert(!match("fo[a-d]", "fot", { extended: true }));
    assert(!match("fo[!tz]", "fot", { extended: true }));
    assert(match("fo[!tz]", "fob", { extended: true }));

    const tester = (globstar: boolean): void => {
      assert(match("fo[oz]", "foo", { extended: true, globstar }));
      assert(match("fo[oz]", "foz", { extended: true, globstar }));
      assert(!match("fo[oz]", "fog", { extended: true, globstar }));
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "[globrex] [[:alnum:]] (character class in range)",
  fn(): void {
    assert(match("[[:alnum:]]/bar.txt", "a/bar.txt", { extended: true }));
    assert(
      match("@([[:alnum:]abc]|11)/bar.txt", "11/bar.txt", { extended: true }),
    );
    assert(
      match("@([[:alnum:]abc]|11)/bar.txt", "a/bar.txt", { extended: true }),
    );
    assert(
      match("@([[:alnum:]abc]|11)/bar.txt", "b/bar.txt", { extended: true }),
    );
    assert(
      match("@([[:alnum:]abc]|11)/bar.txt", "c/bar.txt", { extended: true }),
    );
    assert(
      !match("@([[:alnum:]abc]|11)/bar.txt", "abc/bar.txt", { extended: true }),
    );
    assert(
      match("@([[:alnum:]abc]|11)/bar.txt", "3/bar.txt", { extended: true }),
    );
    assert(match("[[:digit:]]/bar.txt", "1/bar.txt", { extended: true }));
    assert(match("[[:digit:]b]/bar.txt", "b/bar.txt", { extended: true }));
    assert(match("[![:digit:]b]/bar.txt", "a/bar.txt", { extended: true }));
    assert(!match("[[:alnum:]]/bar.txt", "!/bar.txt", { extended: true }));
    assert(!match("[[:digit:]]/bar.txt", "a/bar.txt", { extended: true }));
    assert(!match("[[:digit:]b]/bar.txt", "a/bar.txt", { extended: true }));
  },
});

Deno.test({
  name: "[globrex] {} (brace expansion)",
  fn(): void {
    assert(match("foo{bar,baaz}", "foobaaz", { extended: true }));
    assert(match("foo{bar,baaz}", "foobar", { extended: true }));
    assert(!match("foo{bar,baaz}", "foobuzz", { extended: true }));
    assert(match("foo{bar,b*z}", "foobuzz", { extended: true }));

    const tester = (globstar: boolean): void => {
      assert(match("foo{bar,baaz}", "foobaaz", { extended: true, globstar }));
      assert(match("foo{bar,baaz}", "foobar", { extended: true, globstar }));
      assert(!match("foo{bar,baaz}", "foobuzz", { extended: true, globstar }));
      assert(match("foo{bar,b*z}", "foobuzz", { extended: true, globstar }));
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "[globrex] Complex matches",
  fn(): void {
    assert(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://foo.baaz.com/jquery.min.js",
        { extended: true },
      ),
    );
    assert(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.buzz.com/index.html",
        { extended: true },
      ),
    );
    assert(
      !match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.buzz.com/index.htm",
        { extended: true },
      ),
    );
    assert(
      !match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.bar.com/index.html",
        { extended: true },
      ),
    );
    assert(
      !match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://flozz.buzz.com/index.html",
        { extended: true },
      ),
    );

    const tester = (globstar: boolean): void => {
      assert(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://foo.baaz.com/jquery.min.js",
          { extended: true, globstar },
        ),
      );
      assert(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://moz.buzz.com/index.html",
          { extended: true, globstar },
        ),
      );
      assert(
        !match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://moz.buzz.com/index.htm",
          { extended: true, globstar },
        ),
      );
      assert(
        !match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://moz.bar.com/index.html",
          { extended: true, globstar },
        ),
      );
      assert(
        !match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://flozz.buzz.com/index.html",
          { extended: true, globstar },
        ),
      );
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "[globrex] ** (globstar)",
  fn(): void {
    assert(match("/foo/*", "/foo/bar.txt", { globstar: true }));
    assert(match("/foo/**", "/foo/bar.txt", { globstar: true }));
    assert(match("/foo/**", "/foo/bar/baz.txt", { globstar: true }));
    assert(match("/foo/**", "/foo/bar/baz.txt", { globstar: true }));
    assert(match("/foo/*/*.txt", "/foo/bar/baz.txt", { globstar: true }));
    assert(match("/foo/**/*.txt", "/foo/bar/baz.txt", { globstar: true }));
    assert(match("/foo/**/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }));
    assert(match("/foo/**/bar.txt", "/foo/bar.txt", { globstar: true }));
    assert(match("/foo/**/**/bar.txt", "/foo/bar.txt", { globstar: true }));
    assert(match("/foo/**/*/baz.txt", "/foo/bar/baz.txt", { globstar: true }));
    assert(match("/foo/**/*.txt", "/foo/bar.txt", { globstar: true }));
    assert(match("/foo/**/**/*.txt", "/foo/bar.txt", { globstar: true }));
    assert(match("/foo/**/*/*.txt", "/foo/bar/baz.txt", { globstar: true }));
    assert(match("**/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }));
    assert(match("**/foo.txt", "foo.txt", { globstar: true }));
    assert(match("**/*.txt", "foo.txt", { globstar: true }));
    assert(!match("/foo/*", "/foo/bar/baz.txt", { globstar: true }));
    assert(!match("/foo/*.txt", "/foo/bar/baz.txt", { globstar: true }));
    assert(!match("/foo/*/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }));
    assert(!match("/foo/*/bar.txt", "/foo/bar.txt", { globstar: true }));
    assert(!match("/foo/*/*/baz.txt", "/foo/bar/baz.txt", { globstar: true }));
    assert(!match("/foo/**.txt", "/foo/bar/baz/qux.txt", { globstar: true }));
    assert(
      !match("/foo/bar**/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
    );
    assert(!match("/foo/bar**", "/foo/bar/baz.txt", { globstar: true }));
    assert(!match("**/.txt", "/foo/bar/baz/qux.txt", { globstar: true }));
    assert(!match("*/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }));
    assert(!match("*/*.txt", "foo.txt", { globstar: true }));
    assert(
      !match(
        "http://foo.com/*",
        "http://foo.com/bar/baz/jquery.min.js",
        { globstar: true },
      ),
    );
    assert(
      !match("http://foo.com/*", "http://foo.com/bar/baz/jquery.min.js", {
        globstar: true,
      }),
    );
    assert(
      match("http://foo.com/**", "http://foo.com/bar/baz/jquery.min.js", {
        globstar: true,
      }),
    );
    assert(
      match(
        "http://foo.com/**/jquery.min.js",
        "http://foo.com/bar/baz/jquery.min.js",
        { globstar: true },
      ),
    );
    assert(
      !match(
        "http://foo.com/*/jquery.min.js",
        "http://foo.com/bar/baz/jquery.min.js",
        { globstar: true },
      ),
    );
  },
});

Deno.test({
  name: "[globrex] ?(pattern-list) (extended: match zero or one)",
  fn(): void {
    assert(match("(foo).txt", "(foo).txt", { extended: true }));
    assert(match("?(foo).txt", "foo.txt", { extended: true }));
    assert(match("?(foo).txt", ".txt", { extended: true }));
    assert(match("?(foo|bar)baz.txt", "foobaz.txt", { extended: true }));
    assert(match("?(ba[zr]|qux)baz.txt", "bazbaz.txt", { extended: true }));
    assert(match("?(ba[zr]|qux)baz.txt", "barbaz.txt", { extended: true }));
    assert(match("?(ba[zr]|qux)baz.txt", "quxbaz.txt", { extended: true }));
    assert(match("?(ba[!zr]|qux)baz.txt", "batbaz.txt", { extended: true }));
    assert(match("?(ba*|qux)baz.txt", "batbaz.txt", { extended: true }));
    assert(match("?(ba*|qux)baz.txt", "batttbaz.txt", { extended: true }));
    assert(match("?(ba*|qux)baz.txt", "quxbaz.txt", { extended: true }));
    assert(match("?(ba?(z|r)|qux)baz.txt", "bazbaz.txt", { extended: true }));
    assert(
      match("?(ba?(z|?(r))|qux)baz.txt", "bazbaz.txt", { extended: true }),
    );
    assert(!match("?(foo).txt", "foo.txt", { extended: false }));
    assert(!match("?(foo|bar)baz.txt", "foobarbaz.txt", { extended: true }));
    assert(!match("?(ba[zr]|qux)baz.txt", "bazquxbaz.txt", { extended: true }));
    assert(!match("?(ba[!zr]|qux)baz.txt", "bazbaz.txt", { extended: true }));
  },
});

Deno.test({
  name: "[globrex] *(pattern-list) (extended: match zero or more)",
  fn(): void {
    assert(match("*(foo).txt", "foo.txt", { extended: true }));
    assert(match("*foo.txt", "bofoo.txt", { extended: true }));
    assert(match("*(foo).txt", "foofoo.txt", { extended: true }));
    assert(match("*(foo).txt", ".txt", { extended: true }));
    assert(match("*(fooo).txt", ".txt", { extended: true }));
    assert(!match("*(fooo).txt", "foo.txt", { extended: true }));
    assert(match("*(foo|bar).txt", "foobar.txt", { extended: true }));
    assert(match("*(foo|bar).txt", "barbar.txt", { extended: true }));
    assert(match("*(foo|bar).txt", "barfoobar.txt", { extended: true }));
    assert(match("*(foo|bar).txt", ".txt", { extended: true }));
    assert(match("*(foo|ba[rt]).txt", "bat.txt", { extended: true }));
    assert(match("*(foo|b*[rt]).txt", "blat.txt", { extended: true }));
    assert(!match("*(foo|b*[rt]).txt", "tlat.txt", { extended: true }));
    assert(
      match("*(*).txt", "whatever.txt", { extended: true, globstar: true }),
    );
    assert(
      match("*(foo|bar)/**/*.txt", "foo/hello/world/bar.txt", {
        extended: true,
        globstar: true,
      }),
    );
    assert(
      match("*(foo|bar)/**/*.txt", "foo/world/bar.txt", {
        extended: true,
        globstar: true,
      }),
    );
  },
});

Deno.test({
  name: "[globrex] +(pattern-list) (extended: match 1 or more)",
  fn(): void {
    assert(match("+(foo).txt", "foo.txt", { extended: true }));
    assert(match("+foo.txt", "+foo.txt", { extended: true }));
    assert(!match("+(foo).txt", ".txt", { extended: true }));
    assert(match("+(foo|bar).txt", "foobar.txt", { extended: true }));
  },
});

Deno.test({
  name: "[globrex] @(pattern-list) (extended: match one)",
  fn(): void {
    assert(match("@(foo).txt", "foo.txt", { extended: true }));
    assert(match("@foo.txt", "@foo.txt", { extended: true }));
    assert(match("@(foo|baz)bar.txt", "foobar.txt", { extended: true }));
    assert(!match("@(foo|baz)bar.txt", "foobazbar.txt", { extended: true }));
    assert(!match("@(foo|baz)bar.txt", "foofoobar.txt", { extended: true }));
    assert(!match("@(foo|baz)bar.txt", "toofoobar.txt", { extended: true }));
  },
});

Deno.test({
  name: "[globrex] !(pattern-list) (extended: match any except)",
  fn(): void {
    assert(match("!(boo).txt", "foo.txt", { extended: true }));
    assert(match("!(foo|baz)bar.txt", "buzbar.txt", { extended: true }));
    assert(match("!bar.txt", "!bar.txt", { extended: true }));
    assert(match("!({foo,bar})baz.txt", "notbaz.txt", { extended: true }));
    assert(!match("!({foo,bar})baz.txt", "foobaz.txt", { extended: true }));
  },
});

Deno.test({
  name: "[globrex] Special extended characters should match themselves",
  fn(): void {
    const tester = (globstar: boolean): void => {
      const testExtStr = "\\/$^+.()=!|,.*";
      assert(match(testExtStr, testExtStr, { extended: true }));
      assert(match(testExtStr, testExtStr, { extended: true, globstar }));
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "[globrex] Repeating slashes",
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
