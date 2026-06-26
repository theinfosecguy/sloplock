import { describe, expect, it } from "vitest";
import { CratesRegistryClient } from "../src/registries/crates.js";

describe("CratesRegistryClient", () => {
  it("returns first published timestamp from crate metadata", async () => {
    const client = new CratesRegistryClient({
      fetchImpl: () =>
        Promise.resolve(new Response(
          JSON.stringify({
            crate: {
              id: "serde",
              name: "serde",
              created_at: "2014-12-05T20:20:39.487502Z"
            },
            versions: [
              {
                created_at: "2024-01-01T00:00:00.000Z"
              }
            ]
          }),
          { status: 200 }
        ))
    });

    const result = await client.getPackage({
      ecosystem: "crates",
      name: "serde"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2014-12-05T20:20:39.487Z"
    );
  });

  it("falls back to earliest version timestamp", async () => {
    const client = new CratesRegistryClient({
      fetchImpl: () =>
        Promise.resolve(new Response(
          JSON.stringify({
            crate: {
              id: "serde",
              name: "serde"
            },
            versions: [
              {
                created_at: "2024-01-01T00:00:00.000Z"
              },
              {
                created_at: "2020-01-01T00:00:00.000Z"
              }
            ]
          }),
          { status: 200 }
        ))
    });

    const result = await client.getPackage({
      ecosystem: "crates",
      name: "serde"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2020-01-01T00:00:00.000Z"
    );
  });

  it("returns not_found for crates.io 404 responses", async () => {
    const client = new CratesRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 404 }))
    });

    await expect(
      client.getPackage({ ecosystem: "crates", name: "missing-crate" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "crates",
      name: "missing-crate"
    });
  });

  it("does not report unsupported ecosystems as crates.io results", async () => {
    const client = new CratesRegistryClient({
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
