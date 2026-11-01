import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { loginReturnPath, shareSlug } from "../../shared/utils/share";

describe("loginReturnPath", () => {
  it("accepts a shared recipe", () => {
    expect(loginReturnPath("/r/AbC_-1234567")).toBe("/r/AbC_-1234567");
  });

  it.each([
    undefined,
    "",
    "/",
    "/book",
    "//evil.example",
    "https://evil.example/r/AAAAAAAAAAAA",
    "/r/AAAAAAAAAAA",
    "/r/AAAAAAAAAAAAA",
    "/r/AAAAAAAAAAAA/",
    "/r/AAAAAAAAAAAA?x=1",
    "/r/AAAAAAAAAAAA#x",
    "/r/../AAAAAAAAAA",
    "/r/AAAAAAAAAAA%2F",
    "/r/AAAAAAAAAAAA\n",
    "\\\\evil.example",
  ])("refuses %j", (value) => {
    expect(loginReturnPath(value)).toBeUndefined();
  });

  it("returns nothing but a same-site path to a shared recipe", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webUrl(), fc.webPath()), (value) => {
        const path = loginReturnPath(value);
        if (path !== undefined) {
          expect(path.startsWith("/r/")).toBe(true);
          expect(shareSlug.test(path.slice(3))).toBe(true);
        }
      }),
    );
  });
});
