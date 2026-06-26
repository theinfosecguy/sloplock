import { describe, expect, it } from "vitest";
import { MavenCentralRegistryClient } from "../src/registries/maven.js";

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

describe("MavenCentralRegistryClient", () => {
  it("queries exact group and artifact coordinates and returns the earliest timestamp", async () => {
    const requestedUrls: string[] = [];
    const client = new MavenCentralRegistryClient({
      fetchImpl: (input) => {
        const url = requestUrl(input);
        requestedUrls.push(url);
        const start = new URL(url).searchParams.get("start");

        return Promise.resolve(
          new Response(
            JSON.stringify({
              response: {
                numFound: 2,
                docs:
                  start === "0"
                    ? [
                        {
                          g: "org.slf4j",
                          a: "slf4j-api",
                          timestamp: Date.parse("2021-01-01T00:00:00.000Z")
                        }
                      ]
                    : [
                        {
                          g: "org.slf4j",
                          a: "slf4j-api",
                          timestamp: Date.parse("2020-01-01T00:00:00.000Z")
                        }
                      ]
              }
            }),
            { status: 200 }
          )
        );
      }
    });

    const result = await client.getPackage({
      ecosystem: "maven",
      name: "org.slf4j:slf4j-api"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2020-01-01T00:00:00.000Z"
    );
    expect(requestedUrls).toHaveLength(2);
    const firstUrl = new URL(requestedUrls[0] ?? "");
    expect(firstUrl.origin + firstUrl.pathname).toBe(
      "https://central.sonatype.com/solrsearch/select"
    );
    expect(firstUrl.searchParams.get("q")).toBe(
      "g:org.slf4j AND a:slf4j-api"
    );
    expect(firstUrl.searchParams.get("core")).toBe("gav");
    expect(firstUrl.searchParams.get("wt")).toBe("json");
    expect(firstUrl.searchParams.get("rows")).toBe("200");
    expect(firstUrl.searchParams.get("start")).toBe("0");
    expect(new URL(requestedUrls[1] ?? "").searchParams.get("start")).toBe("200");
  });

  it("returns not_found when Maven Central reports no exact GAV documents", async () => {
    const client = new MavenCentralRegistryClient({
      fetchImpl: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              response: {
                numFound: 0,
                docs: []
              }
            }),
            { status: 200 }
          )
        )
    });

    await expect(
      client.getPackage({ ecosystem: "maven", name: "com.acme:missing" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "maven",
      name: "com.acme:missing"
    });
  });

  it("reports malformed Maven Central responses as registry failures", async () => {
    const client = new MavenCentralRegistryClient({
      fetchImpl: () =>
        Promise.resolve(
          new Response(JSON.stringify({ response: { docs: "bad" } }), {
            status: 200
          })
        )
    });

    await expect(
      client.getPackage({ ecosystem: "maven", name: "com.acme:broken" })
    ).resolves.toMatchObject({
      status: "invalid_response",
      ecosystem: "maven",
      name: "com.acme:broken"
    });
  });

  it("reports rate limits and server errors as retryable failures", async () => {
    const rateLimited = new MavenCentralRegistryClient({
      retries: 0,
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 429 }))
    });
    const serverError = new MavenCentralRegistryClient({
      retries: 0,
      fetchImpl: () => Promise.resolve(new Response("{}", { status: 503 }))
    });

    await expect(
      rateLimited.getPackage({ ecosystem: "maven", name: "com.acme:rate" })
    ).resolves.toMatchObject({
      status: "rate_limited",
      retryable: true
    });
    await expect(
      serverError.getPackage({ ecosystem: "maven", name: "com.acme:server" })
    ).resolves.toMatchObject({
      status: "server_error",
      retryable: true
    });
  });

  it("does not report unsupported ecosystems as Maven results", async () => {
    const client = new MavenCentralRegistryClient({
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
