import { describe, expect, it } from "vitest";
import type { ScanResult } from "../src/core/types.js";
import type { ActionInputs } from "../src/action/inputs.js";
import {
  buildCommentWarnings,
  buildSetupWarnings,
  withWarnings
} from "../src/action/setup-warnings.js";

describe("Action setup warnings", () => {
  it("warns when changed-only mode has no stable base outside pull requests", () => {
    const warnings = buildSetupWarnings({
      inputs: actionInputs({ changedOnly: true }),
      hasPullRequest: false,
      dependencyFileCount: 1,
      isShallowRepository: false,
      result: scanResult({ scannedDependencies: 1 })
    });

    expect(warnings.map((warning) => warning.message)).toContain(
      "Changed-only mode is running without a pull request base or explicit `base` input. SlopLock will rely on its default base; run on `pull_request` or set `base` for predictable PR gating."
    );
  });

  it("does not warn about changed-only base when a base is configured", () => {
    const warnings = buildSetupWarnings({
      inputs: actionInputs({ changedOnly: true }),
      baseRef: "origin/main",
      hasPullRequest: false,
      dependencyFileCount: 1,
      isShallowRepository: false,
      result: scanResult({ scannedDependencies: 1 })
    });

    expect(warnings).toEqual([]);
  });

  it("warns when changed-only mode runs from a shallow checkout", () => {
    const warnings = buildSetupWarnings({
      inputs: actionInputs({ changedOnly: true }),
      baseRef: "origin/main",
      hasPullRequest: true,
      dependencyFileCount: 1,
      isShallowRepository: true,
      result: scanResult({ scannedDependencies: 1 })
    });

    expect(warnings.map((warning) => warning.message)).toContain(
      "The checkout is shallow. Changed-only scans need base history; set `actions/checkout` `fetch-depth: 0`."
    );
  });

  it("warns when the configured path has no supported dependency files", () => {
    const warnings = buildSetupWarnings({
      inputs: actionInputs({ path: "frontend`app" }),
      hasPullRequest: true,
      dependencyFileCount: 0,
      isShallowRepository: false,
      result: scanResult({ scannedDependencies: 0 })
    });

    expect(warnings).toEqual([
      {
        message:
          "No supported dependency files were found under `frontend'app`. Confirm the Action `path` points at the repository root or a supported subdirectory."
      }
    ]);
  });

  it("warns when a full scan has files but no public dependency names", () => {
    const warnings = buildSetupWarnings({
      inputs: actionInputs(),
      hasPullRequest: true,
      dependencyFileCount: 1,
      isShallowRepository: false,
      result: scanResult({ scannedDependencies: 0 })
    });

    expect(warnings).toEqual([
      {
        message:
          "Supported dependency files were found, but SlopLock found no public registry dependency names to check. If this is unexpected, review private/local dependency declarations and supported file formats."
      }
    ]);
  });

  it("does not warn about empty changed-only scans", () => {
    const warnings = buildSetupWarnings({
      inputs: actionInputs({ changedOnly: true }),
      baseRef: "origin/main",
      hasPullRequest: true,
      dependencyFileCount: 1,
      isShallowRepository: false,
      result: scanResult({ scannedDependencies: 0 })
    });

    expect(warnings).toEqual([]);
  });

  it("warns when pull request comments are skipped or fail", () => {
    expect(
      buildCommentWarnings({ inputs: actionInputs({ comment: true }), status: "skipped" })
    ).toEqual([
      {
        message:
          "Pull request comment was skipped because this run is not attached to a pull request. Use the `pull_request` event or set `comment: false`."
      }
    ]);
    expect(
      buildCommentWarnings({ inputs: actionInputs({ comment: true }), status: "failed" })
    ).toEqual([
      {
        message:
          "Pull request comment could not be written. Grant `pull-requests: write` or set `comment: false`; results are still available in annotations and the step summary."
      }
    ]);
  });

  it("does not warn when comments are disabled or written", () => {
    expect(
      buildCommentWarnings({ inputs: actionInputs({ comment: false }), status: "failed" })
    ).toEqual([]);
    expect(
      buildCommentWarnings({ inputs: actionInputs({ comment: true }), status: "created" })
    ).toEqual([]);
    expect(
      buildCommentWarnings({ inputs: actionInputs({ comment: true }), status: "updated" })
    ).toEqual([]);
  });

  it("prepends Action warnings to scan warnings", () => {
    const result = scanResult({
      warnings: [{ message: "Existing parser warning." }]
    });
    const merged = withWarnings(result, [{ message: "Action setup warning." }]);

    expect(merged).not.toBe(result);
    expect(merged.warnings).toEqual([
      { message: "Action setup warning." },
      { message: "Existing parser warning." }
    ]);
  });

  it("returns the original result when there are no Action warnings", () => {
    const result = scanResult();

    expect(withWarnings(result, [])).toBe(result);
  });
});

function actionInputs(overrides: Partial<ActionInputs> = {}): ActionInputs {
  return {
    path: ".",
    failOn: "high",
    changedOnly: false,
    comment: false,
    failClosed: false,
    ...overrides
  };
}

function scanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    findings: [],
    warnings: [],
    registryFailures: [],
    scannedDependencies: 1,
    failOn: "high",
    ...overrides
  };
}
