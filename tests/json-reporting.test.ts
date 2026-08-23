import { describe, expect, it } from "vitest";
import { renderJson, renderJsonError } from "../src/reporting/json.js";

describe("json reporting", () => {
  it("renders an error document that shares the report schema version", () => {
    const report = JSON.parse(
      renderJson({
        findings: [],
        warnings: [],
        registryFailures: [],
        scannedDependencies: 0,
        failOn: "high"
      })
    ) as { schemaVersion: string };
    const error = JSON.parse(
      renderJsonError({
        code: "cannot_compute_diff",
        message: "Unable to compute changed files against HEAD~1.",
        hint: "Pass --base, fetch git history with actions/checkout fetch-depth: 0, or run a full scan."
      })
    ) as { schemaVersion: string };

    expect(error).toEqual({
      schemaVersion: report.schemaVersion,
      error: {
        code: "cannot_compute_diff",
        message: "Unable to compute changed files against HEAD~1.",
        hint: "Pass --base, fetch git history with actions/checkout fetch-depth: 0, or run a full scan."
      }
    });
  });

  it("omits the hint when the error does not carry one", () => {
    expect(
      JSON.parse(renderJsonError({ code: "usage_error", message: "Config allow must be an array." }))
    ).toEqual({
      schemaVersion: "1.0",
      error: {
        code: "usage_error",
        message: "Config allow must be an array."
      }
    });
  });
});
