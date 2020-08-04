// This module is ported from
// https://github.com/denoland/deno/blob/v1.2.2/std/path/_globrex_test.ts.
// Copyright 2018 Terkel Gjervig Nielsen. All rights reserved. MIT license.
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.

import { GlobrexOptions, globrex } from "./_globrex.ts";
import { assertEquals } from "./dev_deps.ts";

const t = { equal: assertEquals, is: assertEquals };

function match(
  glob: string,
  strUnix: string,
  strWin?: string | Omit<GlobrexOptions, "os">,
  opts: Omit<GlobrexOptions, "os"> = {},
): boolean {
  if (typeof strWin === "object") {
    opts = strWin;
    strWin = "";
  }
  strWin = strWin || strUnix;
  const regex = globrex(glob, { ...opts, os: "linux" });
  const match = strUnix.match(regex);
  if (match) {
    assertEquals(match.length, 1);
  }
  const regexWin = globrex(glob, { ...opts, os: "windows" });
  const matchWin = strWin.match(regexWin);
  if (matchWin) {
    assertEquals(matchWin.length, 1);
  }
  return !!match && !!matchWin;
}

Deno.test({
  name: "globrex: standard",
  fn(): void {
    const regex = globrex("*.js");
    t.equal(regex.toString(), "/^(?:[^/]*)\\.js$/");
  },
});

Deno.test({
  name: "globrex: Standard * matching",
  fn(): void {
    t.equal(match("*", "foo"), true, "match everything");
    t.equal(match("*", "foo"), true, "match everything");
    t.equal(match("f*", "foo"), true, "match the end");
    t.equal(match("f*", "foo"), true, "match the end");
    t.equal(match("*o", "foo"), true, "match the start");
    t.equal(match("*o", "foo"), true, "match the start");
    t.equal(match("u*orn", "unicorn"), true, "match the middle");
    t.equal(match("u*orn", "unicorn"), true, "match the middle");
    t.equal(match("ico", "unicorn"), false, "do not match without start/end");
    t.equal(match("u*nicorn", "unicorn"), true, "match zero characters");
    t.equal(
      match("u*nicorn", "unicorn"),
      true,
      "match zero characters",
    );
  },
});

Deno.test({
  name: "globrex: ? match one character, no more and no less",
  fn(): void {
    t.equal(match("f?o", "foo", { extended: true }), true);
    t.equal(match("f?o", "fooo", { extended: true }), false);
    t.equal(match("f?oo", "foo", { extended: true }), false);

    const tester = (globstar: boolean): void => {
      t.equal(match("f?o", "foo", { extended: true, globstar }), true);
      t.equal(match("f?o?", "fooo", { extended: true, globstar }), true);

      t.equal(match("f?o", "fooo", { extended: true, globstar }), false);
      t.equal(match("?fo", "fooo", { extended: true, globstar }), false);
      t.equal(match("f?oo", "foo", { extended: true, globstar }), false);
      t.equal(match("foo?", "foo", { extended: true, globstar }), false);
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "globrex: [] match a character range",
  fn(): void {
    t.equal(match("fo[oz]", "foo", { extended: true }), true);
    t.equal(match("fo[oz]", "foz", { extended: true }), true);
    t.equal(match("fo[oz]", "fog", { extended: true }), false);
    t.equal(match("fo[a-z]", "fob", { extended: true }), true);
    t.equal(match("fo[a-d]", "fot", { extended: true }), false);
    t.equal(match("fo[!tz]", "fot", { extended: true }), false);
    t.equal(match("fo[!tz]", "fob", { extended: true }), true);

    const tester = (globstar: boolean): void => {
      t.equal(match("fo[oz]", "foo", { extended: true, globstar }), true);
      t.equal(match("fo[oz]", "foz", { extended: true, globstar }), true);
      t.equal(match("fo[oz]", "fog", { extended: true, globstar }), false);
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "globrex: [] extended character ranges",
  fn(): void {
    t.equal(
      match("[[:alnum:]]/bar.txt", "a/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("@([[:alnum:]abc]|11)/bar.txt", "11/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("@([[:alnum:]abc]|11)/bar.txt", "a/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("@([[:alnum:]abc]|11)/bar.txt", "b/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("@([[:alnum:]abc]|11)/bar.txt", "c/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("@([[:alnum:]abc]|11)/bar.txt", "abc/bar.txt", { extended: true }),
      false,
    );
    t.equal(
      match("@([[:alnum:]abc]|11)/bar.txt", "3/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]]/bar.txt", "1/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]b]/bar.txt", "b/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("[![:digit:]b]/bar.txt", "a/bar.txt", { extended: true }),
      true,
    );
    t.equal(
      match("[[:alnum:]]/bar.txt", "!/bar.txt", { extended: true }),
      false,
    );
    t.equal(
      match("[[:digit:]]/bar.txt", "a/bar.txt", { extended: true }),
      false,
    );
    t.equal(
      match("[[:digit:]b]/bar.txt", "a/bar.txt", { extended: true }),
      false,
    );
  },
});

Deno.test({
  name: "globrex: {} match a choice of different substrings",
  fn(): void {
    t.equal(match("foo{bar,baaz}", "foobaaz", { extended: true }), true);
    t.equal(match("foo{bar,baaz}", "foobar", { extended: true }), true);
    t.equal(match("foo{bar,baaz}", "foobuzz", { extended: true }), false);
    t.equal(match("foo{bar,b*z}", "foobuzz", { extended: true }), true);

    const tester = (globstar: boolean): void => {
      t.equal(
        match("foo{bar,baaz}", "foobaaz", { extended: true, globstar }),
        true,
      );
      t.equal(
        match("foo{bar,baaz}", "foobar", { extended: true, globstar }),
        true,
      );
      t.equal(
        match("foo{bar,baaz}", "foobuzz", { extended: true, globstar }),
        false,
      );
      t.equal(
        match("foo{bar,b*z}", "foobuzz", { extended: true, globstar }),
        true,
      );
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "globrex: complex extended matches",
  fn(): void {
    t.equal(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://foo.baaz.com/jquery.min.js",
        { extended: true },
      ),
      true,
    );
    t.equal(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.buzz.com/index.html",
        { extended: true },
      ),
      true,
    );
    t.equal(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.buzz.com/index.htm",
        { extended: true },
      ),
      false,
    );
    t.equal(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://moz.bar.com/index.html",
        { extended: true },
      ),
      false,
    );
    t.equal(
      match(
        "http://?o[oz].b*z.com/{*.js,*.html}",
        "http://flozz.buzz.com/index.html",
        { extended: true },
      ),
      false,
    );

    const tester = (globstar: boolean): void => {
      t.equal(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://foo.baaz.com/jquery.min.js",
          { extended: true, globstar },
        ),
        true,
      );
      t.equal(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://moz.buzz.com/index.html",
          { extended: true, globstar },
        ),
        true,
      );
      t.equal(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://moz.buzz.com/index.htm",
          { extended: true, globstar },
        ),
        false,
      );
      t.equal(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://moz.bar.com/index.html",
          { extended: true, globstar },
        ),
        false,
      );
      t.equal(
        match(
          "http://?o[oz].b*z.com/{*.js,*.html}",
          "http://flozz.buzz.com/index.html",
          { extended: true, globstar },
        ),
        false,
      );
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "globrex: standard globstar",
  fn(): void {
    const tester = (globstar: boolean): void => {
      t.equal(
        match(
          "http://foo.com/**/{*.js,*.html}",
          "http://foo.com/bar/jquery.min.js",
          { extended: true, globstar },
        ),
        true,
      );
      t.equal(
        match(
          "http://foo.com/**/{*.js,*.html}",
          "http://foo.com/bar/baz/jquery.min.js",
          { extended: true, globstar },
        ),
        globstar,
      );
      t.equal(
        match("http://foo.com/**", "http://foo.com/bar/baz/jquery.min.js", {
          extended: true,
          globstar,
        }),
        globstar,
      );
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "globrex: remaining chars should match themself",
  fn(): void {
    const tester = (globstar: boolean): void => {
      const testExtStr = "\\/$^+.()=!|,.*";
      t.equal(match(testExtStr, testExtStr, { extended: true }), true);
      t.equal(
        match(testExtStr, testExtStr, { extended: true, globstar }),
        true,
      );
    };

    tester(true);
    tester(false);
  },
});

Deno.test({
  name: "globrex: globstar advance testing",
  fn(): void {
    t.equal(match("/foo/*", "/foo/bar.txt", { globstar: true }), true);
    t.equal(match("/foo/**", "/foo/bar.txt", { globstar: true }), true);
    t.equal(match("/foo/**", "/foo/bar/baz.txt", { globstar: true }), true);
    t.equal(match("/foo/**", "/foo/bar/baz.txt", { globstar: true }), true);
    t.equal(
      match("/foo/*/*.txt", "/foo/bar/baz.txt", { globstar: true }),
      true,
    );
    t.equal(
      match("/foo/**/*.txt", "/foo/bar/baz.txt", { globstar: true }),
      true,
    );
    t.equal(
      match("/foo/**/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      true,
    );
    t.equal(match("/foo/**/bar.txt", "/foo/bar.txt", { globstar: true }), true);
    t.equal(
      match("/foo/**/**/bar.txt", "/foo/bar.txt", { globstar: true }),
      true,
    );
    t.equal(
      match("/foo/**/*/baz.txt", "/foo/bar/baz.txt", { globstar: true }),
      true,
    );
    t.equal(match("/foo/**/*.txt", "/foo/bar.txt", { globstar: true }), true);
    t.equal(
      match("/foo/**/**/*.txt", "/foo/bar.txt", { globstar: true }),
      true,
    );
    t.equal(
      match("/foo/**/*/*.txt", "/foo/bar/baz.txt", { globstar: true }),
      true,
    );
    t.equal(
      match("**/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      true,
    );
    t.equal(match("**/foo.txt", "foo.txt", { globstar: true }), true);
    t.equal(match("**/*.txt", "foo.txt", { globstar: true }), true);
    t.equal(match("/foo/*", "/foo/bar/baz.txt", { globstar: true }), false);
    t.equal(match("/foo/*.txt", "/foo/bar/baz.txt", { globstar: true }), false);
    t.equal(
      match("/foo/*/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      false,
    );
    t.equal(match("/foo/*/bar.txt", "/foo/bar.txt", { globstar: true }), false);
    t.equal(
      match("/foo/*/*/baz.txt", "/foo/bar/baz.txt", { globstar: true }),
      false,
    );
    t.equal(
      match("/foo/**.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      false,
    );
    t.equal(
      match("/foo/bar**/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      false,
    );
    t.equal(match("/foo/bar**", "/foo/bar/baz.txt", { globstar: true }), false);
    t.equal(
      match("**/.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      false,
    );
    t.equal(
      match("*/*.txt", "/foo/bar/baz/qux.txt", { globstar: true }),
      false,
    );
    t.equal(match("*/*.txt", "foo.txt", { globstar: true }), false);
    t.equal(
      match(
        "http://foo.com/*",
        "http://foo.com/bar/baz/jquery.min.js",
        { globstar: true },
      ),
      false,
    );
    t.equal(
      match("http://foo.com/*", "http://foo.com/bar/baz/jquery.min.js", {
        globstar: true,
      }),
      false,
    );
    t.equal(
      match("http://foo.com/**", "http://foo.com/bar/baz/jquery.min.js", {
        globstar: true,
      }),
      true,
    );
    t.equal(
      match(
        "http://foo.com/**/jquery.min.js",
        "http://foo.com/bar/baz/jquery.min.js",
        { globstar: true },
      ),
      true,
    );
    t.equal(
      match(
        "http://foo.com/*/jquery.min.js",
        "http://foo.com/bar/baz/jquery.min.js",
        { globstar: true },
      ),
      false,
    );
  },
});

Deno.test({
  name: "globrex: extended extglob ?",
  fn(): void {
    t.equal(match("(foo).txt", "(foo).txt", { extended: true }), true);
    t.equal(match("?(foo).txt", "foo.txt", { extended: true }), true);
    t.equal(match("?(foo).txt", ".txt", { extended: true }), true);
    t.equal(match("?(foo|bar)baz.txt", "foobaz.txt", { extended: true }), true);
    t.equal(
      match("?(ba[zr]|qux)baz.txt", "bazbaz.txt", { extended: true }),
      true,
    );
    t.equal(
      match("?(ba[zr]|qux)baz.txt", "barbaz.txt", { extended: true }),
      true,
    );
    t.equal(
      match("?(ba[zr]|qux)baz.txt", "quxbaz.txt", { extended: true }),
      true,
    );
    t.equal(
      match("?(ba[!zr]|qux)baz.txt", "batbaz.txt", { extended: true }),
      true,
    );
    t.equal(match("?(ba*|qux)baz.txt", "batbaz.txt", { extended: true }), true);
    t.equal(
      match("?(ba*|qux)baz.txt", "batttbaz.txt", { extended: true }),
      true,
    );
    t.equal(match("?(ba*|qux)baz.txt", "quxbaz.txt", { extended: true }), true);
    t.equal(
      match("?(ba?(z|r)|qux)baz.txt", "bazbaz.txt", { extended: true }),
      true,
    );
    t.equal(
      match("?(ba?(z|?(r))|qux)baz.txt", "bazbaz.txt", { extended: true }),
      true,
    );
    t.equal(match("?(foo).txt", "foo.txt", { extended: false }), false);
    t.equal(
      match("?(foo|bar)baz.txt", "foobarbaz.txt", { extended: true }),
      false,
    );
    t.equal(
      match("?(ba[zr]|qux)baz.txt", "bazquxbaz.txt", { extended: true }),
      false,
    );
    t.equal(
      match("?(ba[!zr]|qux)baz.txt", "bazbaz.txt", { extended: true }),
      false,
    );
  },
});

Deno.test({
  name: "globrex: extended extglob *",
  fn(): void {
    t.equal(match("*(foo).txt", "foo.txt", { extended: true }), true);
    t.equal(match("*foo.txt", "bofoo.txt", { extended: true }), true);
    t.equal(match("*(foo).txt", "foofoo.txt", { extended: true }), true);
    t.equal(match("*(foo).txt", ".txt", { extended: true }), true);
    t.equal(match("*(fooo).txt", ".txt", { extended: true }), true);
    t.equal(match("*(fooo).txt", "foo.txt", { extended: true }), false);
    t.equal(match("*(foo|bar).txt", "foobar.txt", { extended: true }), true);
    t.equal(match("*(foo|bar).txt", "barbar.txt", { extended: true }), true);
    t.equal(match("*(foo|bar).txt", "barfoobar.txt", { extended: true }), true);
    t.equal(match("*(foo|bar).txt", ".txt", { extended: true }), true);
    t.equal(match("*(foo|ba[rt]).txt", "bat.txt", { extended: true }), true);
    t.equal(match("*(foo|b*[rt]).txt", "blat.txt", { extended: true }), true);
    t.equal(match("*(foo|b*[rt]).txt", "tlat.txt", { extended: true }), false);
    t.equal(
      match("*(*).txt", "whatever.txt", { extended: true, globstar: true }),
      true,
    );
    t.equal(
      match("*(foo|bar)/**/*.txt", "foo/hello/world/bar.txt", {
        extended: true,
        globstar: true,
      }),
      true,
    );
    t.equal(
      match("*(foo|bar)/**/*.txt", "foo/world/bar.txt", {
        extended: true,
        globstar: true,
      }),
      true,
    );
  },
});

Deno.test({
  name: "globrex: extended extglob +",
  fn(): void {
    t.equal(match("+(foo).txt", "foo.txt", { extended: true }), true);
    t.equal(match("+foo.txt", "+foo.txt", { extended: true }), true);
    t.equal(match("+(foo).txt", ".txt", { extended: true }), false);
    t.equal(match("+(foo|bar).txt", "foobar.txt", { extended: true }), true);
  },
});

Deno.test({
  name: "globrex: extended extglob @",
  fn(): void {
    t.equal(match("@(foo).txt", "foo.txt", { extended: true }), true);
    t.equal(match("@foo.txt", "@foo.txt", { extended: true }), true);
    t.equal(match("@(foo|baz)bar.txt", "foobar.txt", { extended: true }), true);
    t.equal(
      match("@(foo|baz)bar.txt", "foobazbar.txt", { extended: true }),
      false,
    );
    t.equal(
      match("@(foo|baz)bar.txt", "foofoobar.txt", { extended: true }),
      false,
    );
    t.equal(
      match("@(foo|baz)bar.txt", "toofoobar.txt", { extended: true }),
      false,
    );
  },
});

Deno.test({
  name: "globrex: extended extglob !",
  fn(): void {
    t.equal(match("!(boo).txt", "foo.txt", { extended: true }), true);
    t.equal(match("!(foo|baz)bar.txt", "buzbar.txt", { extended: true }), true);
    t.equal(match("!bar.txt", "!bar.txt", { extended: true }), true);
    t.equal(
      match("!({foo,bar})baz.txt", "notbaz.txt", { extended: true }),
      true,
    );
    t.equal(
      match("!({foo,bar})baz.txt", "foobaz.txt", { extended: true }),
      false,
    );
  },
});

Deno.test({
  name: "globrex: stress testing",
  fn(): void {
    t.equal(
      match("**/*/?yfile.{md,js,txt}", "foo/bar/baz/myfile.md", {
        extended: true,
        globstar: true,
      }),
      true,
    );
    t.equal(
      match("**/*/?yfile.{md,js,txt}", "foo/baz/myfile.md", { extended: true }),
      true,
    );
    t.equal(
      match("**/*/?yfile.{md,js,txt}", "foo/baz/tyfile.js", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]_.]/file.js", "1/file.js", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]_.]/file.js", "2/file.js", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]_.]/file.js", "_/file.js", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]_.]/file.js", "./file.js", { extended: true }),
      true,
    );
    t.equal(
      match("[[:digit:]_.]/file.js", "z/file.js", { extended: true }),
      false,
    );
  },
});
