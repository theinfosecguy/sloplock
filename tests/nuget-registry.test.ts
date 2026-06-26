import { describe, expect, it } from "vitest";
import { NugetRegistryClient } from "../src/registries/nuget.js";

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

describe("NugetRegistryClient", () => {
  it("returns the earliest published timestamp from registration metadata", async () => {
    const requestedUrls: string[] = [];
    const client = new NugetRegistryClient({
      fetchImpl: (input) => {
        const url = requestUrl(input);
        requestedUrls.push(url);

        if (url === "https://api.nuget.org/v3/index.json") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                resources: [
                  {
                    "@id": "https://api.nuget.org/v3/registration5-semver1/",
                    "@type": "RegistrationsBaseUrl/3.6.0"
                  }
                ]
              }),
              { status: 200 }
            )
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  items: [
                    {
                      catalogEntry: {
                        published: "2021-01-01T00:00:00Z"
                      }
                    },
                    {
                      catalogEntry: {
                        published: "2020-01-01T00:00:00Z"
                      }
                    }
                  ]
                }
              ]
            }),
            { status: 200 }
          )
        );
      }
    });

    const result = await client.getPackage({
      ecosystem: "nuget",
      name: "Newtonsoft.Json"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2020-01-01T00:00:00.000Z"
    );
    expect(requestedUrls[1]).toBe(
      "https://api.nuget.org/v3/registration5-semver1/newtonsoft.json/index.json"
    );
  });

  it("returns not_found for NuGet.org package 404 responses", async () => {
    const client = new NugetRegistryClient({
      fetchImpl: (input) => {
        const url = requestUrl(input);
        if (url === "https://api.nuget.org/v3/index.json") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                resources: [
                  {
                    "@id": "https://api.nuget.org/v3/registration5-semver1/",
                    "@type": "RegistrationsBaseUrl/3.6.0"
                  }
                ]
              }),
              { status: 200 }
            )
          );
        }

        return Promise.resolve(new Response("{}", { status: 404 }));
      }
    });

    await expect(
      client.getPackage({ ecosystem: "nuget", name: "Missing.Package" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "nuget",
      name: "Missing.Package"
    });
  });

  it("reports invalid registration metadata as a registry failure", async () => {
    const client = new NugetRegistryClient({
      fetchImpl: (input) => {
        const url = requestUrl(input);
        if (url === "https://api.nuget.org/v3/index.json") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                resources: [
                  {
                    "@id": "https://api.nuget.org/v3/registration5-semver1/",
                    "@type": "RegistrationsBaseUrl/3.6.0"
                  }
                ]
              }),
              { status: 200 }
            )
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify({ items: "not an array" }), { status: 200 })
        );
      }
    });

    await expect(
      client.getPackage({ ecosystem: "nuget", name: "Broken.Package" })
    ).resolves.toMatchObject({
      status: "invalid_response",
      ecosystem: "nuget",
      name: "Broken.Package"
    });
  });

  it("does not report unsupported ecosystems as NuGet results", async () => {
    const client = new NugetRegistryClient({
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
