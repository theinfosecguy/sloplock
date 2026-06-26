import { describe, expect, it } from "vitest";
import { PackagistRegistryClient } from "../src/registries/packagist.js";

describe("PackagistRegistryClient", () => {
  it("returns first published timestamp from Packagist package metadata", async () => {
    const client = new PackagistRegistryClient({
      fetchImpl: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              package: {
                name: "monolog/monolog",
                time: "2012-09-10T00:00:00+00:00",
                versions: {
                  "3.0.0": {
                    time: "2022-01-01T00:00:00+00:00"
                  }
                }
              }
            }),
            { status: 200 }
          )
        )
    });

    const result = await client.getPackage({
      ecosystem: "packagist",
      name: "monolog/monolog"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2012-09-10T00:00:00.000Z"
    );
  });

  it("returns not_found for Packagist 404 responses", async () => {
    const client = new PackagistRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 404 }))
    });

    await expect(
      client.getPackage({ ecosystem: "packagist", name: "missing/package" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "packagist",
      name: "missing/package"
    });
  });

  it("treats malformed Packagist metadata as a registry failure", async () => {
    const client = new PackagistRegistryClient({
      fetchImpl: () =>
        Promise.resolve(new Response(JSON.stringify({ package: [] }), { status: 200 }))
    });

    await expect(
      client.getPackage({ ecosystem: "packagist", name: "broken/package" })
    ).resolves.toMatchObject({
      status: "invalid_response",
      ecosystem: "packagist",
      name: "broken/package",
      retryable: false
    });
  });

  it("does not report unsupported ecosystems as Packagist results", async () => {
    const client = new PackagistRegistryClient({
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
