// Copyright 2020 Nayeem Rahman. All rights reserved. MIT license.
// This module is browser compatible.

let nativeOs: typeof Deno.build.os = "linux";
// deno-lint-ignore no-explicit-any
const navigator = (globalThis as any).navigator;
if (globalThis.Deno != null) {
  nativeOs = Deno.build.os;
} else if (navigator?.appVersion?.includes?.("Win") ?? false) {
  nativeOs = "windows";
}
// TODO(nayeemrmn): Improve OS detection in browsers beyond Windows.

export { nativeOs };
