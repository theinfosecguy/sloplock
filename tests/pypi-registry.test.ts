import { describe, expect, it } from "vitest";
import { PypiRegistryClient } from "../src/registries/pypi.js";

describe("PypiRegistryClient", () => {
  it("returns first published timestamp from PyPI release uploads", async () => {
    const client = new PypiRegistryClient({
      fetchImpl: () =>
        Promise.resolve(new Response(
          JSON.stringify({
            releases: {
              "2.0.0": [
                {
                  upload_time_iso_8601: "2024-01-01T00:00:00.000Z"
                }
              ],
              "1.0.0": [
                {
                  upload_time_iso_8601: "2020-01-01T00:00:00.000Z"
                }
              ]
            }
          }),
          { status: 200 }
        ))
    });

    const result = await client.getPackage({
      ecosystem: "pypi",
      name: "django"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2020-01-01T00:00:00.000Z"
    );
  });

  it("returns not_found for PyPI 404 responses", async () => {
    const client = new PypiRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 404 }))
    });

    await expect(
      client.getPackage({ ecosystem: "pypi", name: "missing-package" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "pypi",
      name: "missing-package"
    });
  });

  it("does not report unsupported ecosystems as PyPI results", async () => {
    const client = new PypiRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 200 }))
    });

    await expect(
      client.getPackage({ ecosystem: "npm", name: "react" })
    ).resolves.toMatchObject({
      status: "unsupported",
      ecosystem: "npm",
      name: "react"
    });
  });
});
