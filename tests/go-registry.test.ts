import { describe, expect, it } from "vitest";
import { GoProxyRegistryClient } from "../src/registries/go.js";

function requestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

describe("GoProxyRegistryClient", () => {
  it("returns first observed timestamp from Go module version metadata", async () => {
    const requestedUrls: string[] = [];
    const client = new GoProxyRegistryClient({
      fetchImpl: (input) => {
        const url = requestUrl(input);
        requestedUrls.push(url);

        if (url.endsWith("/@v/list")) {
          return Promise.resolve(
            new Response("v1.2.0\nv1.0.0\nv1.1.0\n", { status: 200 })
          );
        }

        if (url.endsWith("/@v/v1.0.0.info")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                Version: "v1.0.0",
                Time: "2020-01-01T00:00:00Z"
              }),
              { status: 200 }
            )
          );
        }

        if (url.endsWith("/@v/v1.1.0.info")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                Version: "v1.1.0",
                Time: "2021-01-01T00:00:00Z"
              }),
              { status: 200 }
            )
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              Version: "v1.2.0",
              Time: "2022-01-01T00:00:00Z"
            }),
            { status: 200 }
          )
        );
      }
    });

    const result = await client.getPackage({
      ecosystem: "go",
      name: "github.com/Example/Module"
    });

    expect(result.status).toBe("found");
    expect(result.status === "found" ? result.firstPublishedAt?.toISOString() : "").toBe(
      "2020-01-01T00:00:00.000Z"
    );
    expect(requestedUrls[0]).toBe(
      "https://proxy.golang.org/github.com/!example/!module/@v/list"
    );
  });

  it("falls back to latest metadata when a module has no version list", async () => {
    const client = new GoProxyRegistryClient({
      fetchImpl: (input) => {
        const url = requestUrl(input);
        if (url.endsWith("/@v/list")) {
          return Promise.resolve(new Response("", { status: 200 }));
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              Version: "v0.0.0-20260101000000-abcdefabcdef",
              Time: "2026-01-01T00:00:00Z"
            }),
            { status: 200 }
          )
        );
      }
    });

    await expect(
      client.getPackage({ ecosystem: "go", name: "golang.org/x/example" })
    ).resolves.toMatchObject({
      status: "found",
      ecosystem: "go",
      name: "golang.org/x/example",
      firstPublishedAt: new Date("2026-01-01T00:00:00Z")
    });
  });

  it("returns not_found when list and latest are unavailable", async () => {
    const client = new GoProxyRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("missing", { status: 404 }))
    });

    await expect(
      client.getPackage({ ecosystem: "go", name: "github.com/example/missing" })
    ).resolves.toEqual({
      status: "not_found",
      ecosystem: "go",
      name: "github.com/example/missing"
    });
  });

  it("does not report unsupported ecosystems as Go results", async () => {
    const client = new GoProxyRegistryClient({
      fetchImpl: () => Promise.resolve(new Response("", { status: 200 }))
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
