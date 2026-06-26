import { describe, expect, it } from "vitest";
import { RubyGemsRegistryClient } from "../src/registries/rubygems.js";

describe("RubyGemsRegistryClient", () => {
  it("returns first published timestamp from RubyGems version metadata", async () => {
    const client = new RubyGemsRegistryClient({
      fetchImpl: () =>
        Promise.resolve(new Response(
          JSON.stringify([
            {
              number: "2.0.0",
              created_at: "2024-01-01T00:00:00.000Z"
            },
            {
              number: "1.0.0",
              created_at: "2020-01-01T00:00:00.000Z"
            }
          ]),
          { status: 200 }
        ))
    });

    const result = await client.getPackage({
      ecosystem: "rubygems",
      name: "rake"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2020-01-01T00:00:00.000Z"
    );
  });

  it("returns not_found for RubyGems 404 responses", async () => {
    const client = new RubyGemsRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 404 }))
    });

    await expect(
      client.getPackage({ ecosystem: "rubygems", name: "missing-gem" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "rubygems",
      name: "missing-gem"
    });
  });

  it("treats invalid RubyGems responses as registry failures", async () => {
    const client = new RubyGemsRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("{", { status: 200 }))
    });

    await expect(
      client.getPackage({ ecosystem: "rubygems", name: "rake" })
    ).resolves.toMatchObject({
      status: "invalid_response",
      ecosystem: "rubygems",
      name: "rake",
      retryable: false
    });
  });

  it("does not report unsupported ecosystems as RubyGems results", async () => {
    const client = new RubyGemsRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("[]", { status: 200 }))
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
