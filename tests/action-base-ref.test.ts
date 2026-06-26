import { describe, expect, it } from "vitest";
import { resolveChangedOnlyBaseRef } from "../src/action/base-ref.js";

describe("resolveChangedOnlyBaseRef", () => {
  it("prefers the explicit action base input", () => {
    expect(
      resolveChangedOnlyBaseRef({
        inputBase: " release-base ",
        pullRequest: {
          base: {
            sha: "base-sha",
            ref: "main"
          }
        }
      })
    ).toBe("release-base");
  });

  it("uses the pull request base sha when no base input is provided", () => {
    expect(
      resolveChangedOnlyBaseRef({
        pullRequest: {
          base: {
            sha: "abc123",
            ref: "main"
          }
        }
      })
    ).toBe("abc123");
  });

  it("falls back to the pull request base ref", () => {
    expect(
      resolveChangedOnlyBaseRef({
        pullRequest: {
          base: {
            ref: "develop"
          }
        }
      })
    ).toBe("origin/develop");
  });

  it("returns undefined outside pull request context", () => {
    expect(resolveChangedOnlyBaseRef({})).toBeUndefined();
  });
});
