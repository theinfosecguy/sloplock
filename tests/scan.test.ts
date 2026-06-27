import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { scan } from "../src/core/scan.js";
import type { Ecosystem, RegistryClient, RegistryResult } from "../src/core/types.js";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true }))
  );
});

describe("scan", () => {
  it("reports missing and too-new npm packages", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "missing-package": "^1.0.0",
          "fresh-package": "^1.0.0",
          "old-package": "^1.0.0"
        }
      })
    });
    const now = new Date("2026-06-24T00:00:00.000Z");
    const result = await scan({
      rootDir,
      now,
      registryClient: fakeRegistry({
        "missing-package": { status: "not_found", ecosystem: "npm", name: "missing-package" },
        "fresh-package": found("fresh-package", "2026-06-22T00:00:00.000Z"),
        "old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.findings).toHaveLength(2);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("applies allow and ignore config rules", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "missing-package": "^1.0.0",
          "fresh-package": "^1.0.0"
        }
      }),
      "sloplock.yml": `
allow:
  - ecosystem: npm
    package: missing-package
    reason: verified fixture
ignore:
  - rule: package_too_new
    ecosystem: npm
    package: fresh-package
    reason: verified fixture
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "missing-package": { status: "not_found", ecosystem: "npm", name: "missing-package" },
        "fresh-package": found("fresh-package", "2026-06-22T00:00:00.000Z")
      })
    });

    expect(result.findings).toEqual([]);
  });

  it("reports missing and too-new PyPI packages", async () => {
    const rootDir = await tempProject({
      "requirements.txt": `
missing-python-package==1.0.0
fresh-python-package>=1.0.0
old-python-package~=1.0
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        },
        "pypi:fresh-python-package": found(
          "fresh-python-package",
          "2026-06-22T00:00:00.000Z",
          "pypi"
        ),
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "pypi",
      "pypi"
    ]);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("reports missing and too-new Packagist packages", async () => {
    const rootDir = await tempProject({
      "composer.json": JSON.stringify({
        require: {
          "example/missing-package": "^1.0.0",
          "example/fresh-package": "^1.0.0",
          "example/old-package": "^1.0.0"
        }
      })
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "packagist:example/missing-package": {
          status: "not_found",
          ecosystem: "packagist",
          name: "example/missing-package"
        },
        "packagist:example/fresh-package": found(
          "example/fresh-package",
          "2026-06-22T00:00:00.000Z",
          "packagist"
        ),
        "packagist:example/old-package": found(
          "example/old-package",
          "2020-01-01T00:00:00.000Z",
          "packagist"
        )
      })
    });

    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "packagist",
      "packagist"
    ]);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("reports missing and too-new NuGet packages from project files", async () => {
    const rootDir = await tempProject({
      "src/App/App.csproj": `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Example.Missing" Version="1.0.0" />
    <PackageReference Include="Example.Fresh" Version="1.0.0" />
    <PackageReference Include="Example.Old" Version="1.0.0" />
  </ItemGroup>
</Project>
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "nuget:example.missing": {
          status: "not_found",
          ecosystem: "nuget",
          name: "example.missing"
        },
        "nuget:example.fresh": found(
          "example.fresh",
          "2026-06-22T00:00:00.000Z",
          "nuget"
        ),
        "nuget:example.old": found(
          "example.old",
          "2020-01-01T00:00:00.000Z",
          "nuget"
        )
      })
    });

    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "nuget",
      "nuget"
    ]);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "example.fresh",
      "example.missing"
    ]);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("reports missing and too-new Maven packages from pom.xml", async () => {
    const rootDir = await tempProject({
      "pom.xml": `
<project>
  <dependencies>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>missing-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>fresh-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>old-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>snapshot-lib</artifactId>
      <version>1.0.0-SNAPSHOT</version>
    </dependency>
  </dependencies>
</project>
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "maven:com.acme:missing-lib": {
          status: "not_found",
          ecosystem: "maven",
          name: "com.acme:missing-lib"
        },
        "maven:com.acme:fresh-lib": found(
          "com.acme:fresh-lib",
          "2026-06-22T00:00:00.000Z",
          "maven"
        ),
        "maven:com.acme:old-lib": found(
          "com.acme:old-lib",
          "2020-01-01T00:00:00.000Z",
          "maven"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "maven",
      "maven"
    ]);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "com.acme:fresh-lib",
      "com.acme:missing-lib"
    ]);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("skips Maven Central misses when pom.xml declares custom repositories", async () => {
    const rootDir = await tempProject({
      "pom.xml": `
<project>
  <repositories>
    <repository>
      <id>internal</id>
      <url>https://repo.example.invalid/maven2</url>
    </repository>
  </repositories>
  <dependencies>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>internal-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
`
    });
    const result = await scan({
      rootDir,
      registryClient: fakeRegistry({
        "maven:com.acme:internal-lib": {
          status: "not_found",
          ecosystem: "maven",
          name: "com.acme:internal-lib"
        }
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings).toEqual([]);
    expect(result.warnings.map((warning) => warning.message)).toContain(
      "Skipped Maven coordinate com.acme:internal-lib because pom.xml declares custom repositories and Maven Central did not prove the coordinate is public."
    );
  });

  it("scans Maven packages from Gradle lockfiles without failing ambiguous misses", async () => {
    const rootDir = await tempProject({
      "gradle.lockfile": `
com.acme:missing-gradle-lib:1.0.0=runtimeClasspath
com.acme:fresh-gradle-lib:1.0.0=runtimeClasspath
com.acme:old-gradle-lib:1.0.0=runtimeClasspath
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "maven:com.acme:missing-gradle-lib": {
          status: "not_found",
          ecosystem: "maven",
          name: "com.acme:missing-gradle-lib"
        },
        "maven:com.acme:fresh-gradle-lib": found(
          "com.acme:fresh-gradle-lib",
          "2026-06-22T00:00:00.000Z",
          "maven"
        ),
        "maven:com.acme:old-gradle-lib": found(
          "com.acme:old-gradle-lib",
          "2020-01-01T00:00:00.000Z",
          "maven"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.package)).toEqual([
      "com.acme:fresh-gradle-lib"
    ]);
    expect(result.findings[0]?.rule).toBe("package_too_new");
    expect(result.warnings.map((warning) => warning.message)).toContain(
      "Skipped Maven coordinate com.acme:missing-gradle-lib because Gradle lockfiles do not record repository source and Maven Central did not prove the coordinate is public."
    );
  });

  it("skips NuGet packages not mapped to NuGet.org", async () => {
    const rootDir = await tempProject({
      "NuGet.config": `
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="private" value="https://nuget.example.invalid/v3/index.json" />
  </packageSources>
  <packageSourceMapping>
    <packageSource key="nuget.org">
      <package pattern="Public.*" />
    </packageSource>
    <packageSource key="private">
      <package pattern="Private.*" />
    </packageSource>
  </packageSourceMapping>
</configuration>
`,
      "src/App/App.csproj": `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Public.Package" Version="1.0.0" />
    <PackageReference Include="Private.Package" Version="1.0.0" />
  </ItemGroup>
</Project>
`
    });
    const calls: string[] = [];
    const result = await scan({
      rootDir,
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve(
            found(reference.name, "2020-01-01T00:00:00.000Z", reference.ecosystem)
          );
        }
      }
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings).toEqual([]);
    expect(calls).toEqual(["nuget:public.package"]);
    expect(result.warnings.map((warning) => warning.message)).toContain(
      "Skipped 1 NuGet package reference not mapped to NuGet.org."
    );
  });

  it("skips NuGet packages configured as private", async () => {
    const rootDir = await tempProject({
      "sloplock.yml": `
nuget:
  privatePackages:
    - Private.*
`,
      "src/App/App.csproj": `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Public.Package" Version="1.0.0" />
    <PackageReference Include="Private.Internal.Package" Version="1.0.0" />
  </ItemGroup>
</Project>
`
    });
    const calls: string[] = [];
    const result = await scan({
      rootDir,
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve(
            found(reference.name, "2020-01-01T00:00:00.000Z", reference.ecosystem)
          );
        }
      }
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings).toEqual([]);
    expect(calls).toEqual(["nuget:public.package"]);
    expect(result.warnings.map((warning) => warning.message)).toContain(
      "Skipped 1 NuGet package reference configured as private."
    );
  });

  it("does not query public registries for new ecosystem private sources", async () => {
    const rootDir = await tempProject({
      "NuGet.config": `
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="private" value="https://nuget.example.invalid/v3/index.json" />
  </packageSources>
  <packageSourceMapping>
    <packageSource key="nuget.org">
      <package pattern="Newtonsoft.*" />
    </packageSource>
    <packageSource key="private">
      <package pattern="Private.*" />
    </packageSource>
  </packageSourceMapping>
</configuration>
`,
      "App.csproj": `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="Private.Package" Version="1.0.0" />
  </ItemGroup>
</Project>
`,
      "composer.json": JSON.stringify({
        require: {
          "monolog/monolog": "^3.0",
          "private/package": "1.0.0"
        },
        repositories: [
          {
            type: "composer",
            url: "https://packages.example.invalid",
            only: ["private/package"]
          }
        ]
      }),
      Gemfile: `
source "https://rubygems.org"

gem "rake", "~> 13.0"
gem "local-gem", path: "../local-gem"

source "https://gems.example.invalid" do
  gem "private-gem", "1.0.0"
end
`
    });
    const calls: string[] = [];
    const result = await scan({
      rootDir,
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve(
            found(reference.name, "2020-01-01T00:00:00.000Z", reference.ecosystem)
          );
        }
      }
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings).toEqual([]);
    expect(calls.sort()).toEqual([
      "nuget:newtonsoft.json",
      "packagist:monolog/monolog",
      "rubygems:rake"
    ]);
    expect(result.warnings.map((warning) => warning.message)).toContain(
      "Skipped 1 NuGet package reference not mapped to NuGet.org."
    );
  });

  it("reports missing and too-new Rust crates", async () => {
    const rootDir = await tempProject({
      "Cargo.toml": `
[dependencies]
missing-crate = "1"
fresh-crate = "1"
old-crate = "1"
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "crates:missing-crate": {
          status: "not_found",
          ecosystem: "crates",
          name: "missing-crate"
        },
        "crates:fresh-crate": found(
          "fresh-crate",
          "2026-06-22T00:00:00.000Z",
          "crates"
        ),
        "crates:old-crate": found(
          "old-crate",
          "2020-01-01T00:00:00.000Z",
          "crates"
        )
      })
    });

    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "crates",
      "crates"
    ]);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("reports missing and too-new Go modules from go.mod", async () => {
    const rootDir = await tempProject({
      "go.mod": `
module example.com/service

go 1.24

require (
  github.com/example/missing-module v1.0.0
  github.com/example/fresh-module v1.0.0
  github.com/example/old-module v1.0.0
  github.com/example/local-module v1.0.0
)

replace github.com/example/local-module => ../local-module
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "go:github.com/example/missing-module": {
          status: "not_found",
          ecosystem: "go",
          name: "github.com/example/missing-module"
        },
        "go:github.com/example/fresh-module": found(
          "github.com/example/fresh-module",
          "2026-06-22T00:00:00.000Z",
          "go"
        ),
        "go:github.com/example/old-module": found(
          "github.com/example/old-module",
          "2020-01-01T00:00:00.000Z",
          "go"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "go",
      "go"
    ]);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "github.com/example/fresh-module",
      "github.com/example/missing-module"
    ]);
  });

  it("reports missing and too-new RubyGems packages from Gemfile", async () => {
    const rootDir = await tempProject({
      Gemfile: `
source "https://rubygems.org"

gem "missing-gem", "1.0.0"
gem "fresh-gem", "1.0.0"
gem "old-gem", "1.0.0"
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "rubygems:missing-gem": {
          status: "not_found",
          ecosystem: "rubygems",
          name: "missing-gem"
        },
        "rubygems:fresh-gem": found(
          "fresh-gem",
          "2026-06-22T00:00:00.000Z",
          "rubygems"
        ),
        "rubygems:old-gem": found(
          "old-gem",
          "2020-01-01T00:00:00.000Z",
          "rubygems"
        )
      })
    });

    expect(result.findings.map((finding) => finding.ecosystem)).toEqual([
      "rubygems",
      "rubygems"
    ]);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "fresh-gem",
      "missing-gem"
    ]);
    expect(result.findings.map((finding) => finding.rule).sort()).toEqual([
      "package_not_found",
      "package_too_new"
    ]);
  });

  it("scans RubyGems packages from Gemfile.lock", async () => {
    const rootDir = await tempProject({
      "Gemfile.lock": `
GEM
  remote: https://rubygems.org/
  specs:
    missing-gem (1.0.0)
    fresh-gem (1.0.0)
    old-gem (1.0.0)

GIT
  remote: https://github.com/example/private-gem.git
  specs:
    private-gem (1.0.0)
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "rubygems:missing-gem": {
          status: "not_found",
          ecosystem: "rubygems",
          name: "missing-gem"
        },
        "rubygems:fresh-gem": found(
          "fresh-gem",
          "2026-06-22T00:00:00.000Z",
          "rubygems"
        ),
        "rubygems:old-gem": found(
          "old-gem",
          "2020-01-01T00:00:00.000Z",
          "rubygems"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "fresh-gem",
      "missing-gem"
    ]);
    expect(result.findings.map((finding) => finding.source.file)).toEqual([
      "Gemfile.lock",
      "Gemfile.lock"
    ]);
  });

  it("skips Go private modules from config and environment patterns", async () => {
    const previousGoPrivate = process.env.GOPRIVATE;
    process.env.GOPRIVATE = "gitlab.example.com/private/*";

    const rootDir = await tempProject({
      "sloplock.yml": `
go:
  privateModules:
    - corp.example.com
    - github.com/acme/*
`,
      "go.mod": `
module example.com/service

go 1.24

require (
  corp.example.com/internal/module v1.0.0
  github.com/acme/private-module v1.0.0
  gitlab.example.com/private/module v1.0.0
  github.com/public/module v1.0.0
)
`
    });
    const calls: string[] = [];

    try {
      const result = await scan({
        rootDir,
        registryClient: {
          getPackage(reference) {
            calls.push(`${reference.ecosystem}:${reference.name}`);
            return Promise.resolve(
              found(reference.name, "2020-01-01T00:00:00.000Z", reference.ecosystem)
            );
          }
        }
      });

      expect(result.scannedDependencies).toBe(1);
      expect(result.findings).toEqual([]);
      expect(calls).toEqual(["go:github.com/public/module"]);
    } finally {
      if (previousGoPrivate === undefined) {
        delete process.env.GOPRIVATE;
      } else {
        process.env.GOPRIVATE = previousGoPrivate;
      }
    }
  });

  it("discovers common Python requirements files", async () => {
    const rootDir = await tempProject({
      "requirements-dev.txt": "missing-python-package==1.0.0\n"
    });
    const result = await scan({
      rootDir,
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        }
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
    expect(result.findings[0]?.package).toBe("missing-python-package");
    expect(result.findings[0]?.source.file).toBe("requirements-dev.txt");
  });

  it("follows requirements includes", async () => {
    const rootDir = await tempProject({
      "requirements.txt": "-r requirements-dev.txt\n",
      "requirements-dev.txt": "missing-python-package==1.0.0\n"
    });
    const result = await scan({
      rootDir,
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        }
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.package).toBe("missing-python-package");
    expect(result.findings[0]?.source.file).toBe("requirements-dev.txt");
  });

  it("follows requirements includes with nonstandard file names", async () => {
    const rootDir = await tempProject({
      "requirements.txt": "-r dev.txt\n",
      "dev.txt": "missing-python-package==1.0.0\n"
    });
    const result = await scan({
      rootDir,
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        }
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.package).toBe("missing-python-package");
    expect(result.findings[0]?.source.file).toBe("dev.txt");
  });

  it("scans PyPI packages from pdm.lock", async () => {
    const rootDir = await tempProject({
      "pdm.lock": `
[metadata]
groups = ["default"]
lock_version = "4.5.0"

[[package]]
name = "missing-python-package"
version = "1.0.0"
groups = ["default"]

[[package]]
name = "fresh-python-package"
version = "1.0.0"
groups = ["default"]

[[package]]
name = "old-python-package"
version = "1.0.0"
groups = ["default"]

[[package]]
name = "local-python-package"
version = "1.0.0"
editable = true
path = "../local-python-package"
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        },
        "pypi:fresh-python-package": found(
          "fresh-python-package",
          "2026-06-22T00:00:00.000Z",
          "pypi"
        ),
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "fresh-python-package",
      "missing-python-package"
    ]);
    expect(result.findings.map((finding) => finding.source.file)).toEqual([
      "pdm.lock",
      "pdm.lock"
    ]);
  });

  it("scans PyPI packages from uv.lock", async () => {
    const rootDir = await tempProject({
      "uv.lock": `
version = 1
revision = 2
requires-python = ">=3.12"

[[package]]
name = "missing-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "fresh-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "old-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "local-python-package"
version = "1.0.0"
source = { path = "../local-python-package" }
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        },
        "pypi:fresh-python-package": found(
          "fresh-python-package",
          "2026-06-22T00:00:00.000Z",
          "pypi"
        ),
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "fresh-python-package",
      "missing-python-package"
    ]);
    expect(result.findings.map((finding) => finding.source.file)).toEqual([
      "uv.lock",
      "uv.lock"
    ]);
  });

  it("discovers PyPI packages from poetry.lock", async () => {
    const rootDir = await tempProject({
      "poetry.lock": `
[[package]]
name = "missing-python-package"
version = "1.0.0"
`
    });
    const result = await scan({
      rootDir,
      registryClient: fakeRegistry({
        "pypi:missing-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "missing-python-package"
        }
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
    expect(result.findings[0]?.package).toBe("missing-python-package");
    expect(result.findings[0]?.source.file).toBe("poetry.lock");
  });

  it("skips Poetry packages locked to private sources", async () => {
    const rootDir = await tempProject({
      "poetry.lock": `
[[package]]
name = "sloplock-private-index-gha-202606261119"
version = "1.0.0"
description = "Private index package fixture."
optional = false
python-versions = ">=3.8"
files = []

[package.source]
type = "legacy"
url = "https://packages.example.invalid/simple"
reference = "private"
`
    });
    const calls: string[] = [];
    const result = await scan({
      rootDir,
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve({
            status: "not_found",
            ecosystem: reference.ecosystem,
            name: reference.name
          });
        }
      }
    });

    expect(result.scannedDependencies).toBe(0);
    expect(result.findings).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("scans Packagist packages from composer.lock", async () => {
    const rootDir = await tempProject({
      "composer.lock": JSON.stringify({
        packages: [
          {
            name: "example/missing-package",
            version: "1.0.0",
            "notification-url": "https://packagist.org/downloads/"
          },
          {
            name: "example/fresh-package",
            version: "1.0.0",
            "notification-url": "https://packagist.org/downloads/"
          },
          {
            name: "example/old-package",
            version: "1.0.0",
            "notification-url": "https://packagist.org/downloads/"
          },
          {
            name: "example/private-package",
            version: "1.0.0",
            "notification-url": "https://packages.example.invalid/downloads/"
          }
        ]
      })
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "packagist:example/missing-package": {
          status: "not_found",
          ecosystem: "packagist",
          name: "example/missing-package"
        },
        "packagist:example/fresh-package": found(
          "example/fresh-package",
          "2026-06-22T00:00:00.000Z",
          "packagist"
        ),
        "packagist:example/old-package": found(
          "example/old-package",
          "2020-01-01T00:00:00.000Z",
          "packagist"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "example/fresh-package",
      "example/missing-package"
    ]);
    expect(result.findings.map((finding) => finding.source.file)).toEqual([
      "composer.lock",
      "composer.lock"
    ]);
  });

  it("filters scans to a selected ecosystem", async () => {
    const rootDir = await tempProject({
      "Cargo.toml": `
[dependencies]
missing-crate = "1"
`,
      "package.json": JSON.stringify({
        dependencies: {
          "missing-npm-package": "^1.0.0"
        }
      }),
      "requirements.txt": "missing-python-package==1.0.0\n"
    });
    const calls: string[] = [];
    const result = await scan({
      rootDir,
      ecosystems: ["pypi"],
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve({
            status: "not_found",
            ecosystem: reference.ecosystem,
            name: reference.name
          });
        }
      }
    });

    expect(result.scannedDependencies).toBe(1);
    expect(calls).toEqual(["pypi:missing-python-package"]);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
  });

  it("scans Rust crates from Cargo.lock", async () => {
    const rootDir = await tempProject({
      "Cargo.lock": `
version = 3

[[package]]
name = "missing-crate"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "fresh-crate"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "old-crate"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "local-crate"
version = "0.1.0"
`
    });
    const result = await scan({
      rootDir,
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "crates:missing-crate": {
          status: "not_found",
          ecosystem: "crates",
          name: "missing-crate"
        },
        "crates:fresh-crate": found(
          "fresh-crate",
          "2026-06-22T00:00:00.000Z",
          "crates"
        ),
        "crates:old-crate": found(
          "old-crate",
          "2020-01-01T00:00:00.000Z",
          "crates"
        )
      })
    });

    expect(result.scannedDependencies).toBe(3);
    expect(result.findings.map((finding) => finding.package).sort()).toEqual([
      "fresh-crate",
      "missing-crate"
    ]);
    expect(result.findings.map((finding) => finding.source.file)).toEqual([
      "Cargo.lock",
      "Cargo.lock"
    ]);
  });

  it("changed-only scans only packages introduced after the base ref", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "old-package": "^1.0.0"
        }
      })
    });

    await git(rootDir, ["init", "-b", "main"]);
    await git(rootDir, ["add", "package.json"]);
    await git(rootDir, [
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.email=sloplock@example.test",
      "-c",
      "user.name=SlopLock",
      "commit",
      "-m",
      "base"
    ]);
    await git(rootDir, ["checkout", "-b", "feature"]);
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({
        dependencies: {
          "old-package": "^1.0.0",
          "new-missing-package": "^1.0.0"
        }
      })
    );
    await git(rootDir, ["add", "package.json"]);
    await git(rootDir, [
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.email=sloplock@example.test",
      "-c",
      "user.name=SlopLock",
      "commit",
      "-m",
      "feature"
    ]);

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "new-missing-package": {
          status: "not_found",
          ecosystem: "npm",
          name: "new-missing-package"
        },
        "old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.package).toBe("new-missing-package");
  });

  it("changed-only scans packages from added nested manifests", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "old-package": "^1.0.0"
        }
      })
    });

    await initGitRepository(rootDir);
    await mkdir(path.join(rootDir, "packages", "app"), { recursive: true });
    await writeFile(
      path.join(rootDir, "packages", "app", "package.json"),
      JSON.stringify({
        dependencies: {
          "nested-missing-package": "^1.0.0"
        }
      })
    );
    await commitAll(rootDir, "add nested package");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "nested-missing-package": {
          status: "not_found",
          ecosystem: "npm",
          name: "nested-missing-package"
        },
        "old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.package).toBe("nested-missing-package");
    expect(result.findings[0]?.source.file).toBe("packages/app/package.json");
  });

  it("changed-only scans dependency additions from lockfile-only changes", async () => {
    const rootDir = await tempProject({
      "package-lock.json": JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {},
          "node_modules/old-package": {
            version: "1.0.0",
            resolved: "https://registry.npmjs.org/old-package/-/old-package-1.0.0.tgz"
          }
        }
      })
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "package-lock.json"),
      JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {},
          "node_modules/old-package": {
            version: "1.0.0",
            resolved: "https://registry.npmjs.org/old-package/-/old-package-1.0.0.tgz"
          },
          "node_modules/lockfile-missing-package": {
            version: "1.0.0",
            resolved:
              "https://registry.npmjs.org/lockfile-missing-package/-/lockfile-missing-package-1.0.0.tgz"
          }
        }
      })
    );
    await commitAll(rootDir, "update lockfile");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "lockfile-missing-package": {
          status: "not_found",
          ecosystem: "npm",
          name: "lockfile-missing-package"
        },
        "old-package": found("old-package", "2020-01-01T00:00:00.000Z")
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.package).toBe("lockfile-missing-package");
    expect(result.findings[0]?.source.file).toBe("package-lock.json");
  });

  it("changed-only scans packages introduced in requirements.txt", async () => {
    const rootDir = await tempProject({
      "requirements.txt": "old-python-package==1.0.0\n"
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "requirements.txt"),
      "old-python-package==1.0.0\nnew-python-package==1.0.0\n"
    );
    await commitAll(rootDir, "update python requirements");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "pypi:new-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "new-python-package"
        },
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
    expect(result.findings[0]?.package).toBe("new-python-package");
  });

  it("changed-only scans packages introduced in composer.json", async () => {
    const rootDir = await tempProject({
      "composer.json": JSON.stringify({
        require: {
          "example/old-package": "^1.0.0"
        }
      })
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "composer.json"),
      JSON.stringify({
        require: {
          "example/old-package": "^1.0.0",
          "example/new-package": "^1.0.0"
        }
      })
    );
    await commitAll(rootDir, "update composer manifest");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "packagist:example/new-package": {
          status: "not_found",
          ecosystem: "packagist",
          name: "example/new-package"
        },
        "packagist:example/old-package": found(
          "example/old-package",
          "2020-01-01T00:00:00.000Z",
          "packagist"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("packagist");
    expect(result.findings[0]?.package).toBe("example/new-package");
    expect(result.findings[0]?.source.file).toBe("composer.json");
  });

  it("changed-only scans packages introduced in pom.xml", async () => {
    const rootDir = await tempProject({
      "pom.xml": `
<project>
  <dependencies>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>old-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "pom.xml"),
      `
<project>
  <dependencies>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>old-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
    <dependency>
      <groupId>com.acme</groupId>
      <artifactId>new-lib</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
`
    );
    await commitAll(rootDir, "update pom");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "maven:com.acme:new-lib": {
          status: "not_found",
          ecosystem: "maven",
          name: "com.acme:new-lib"
        },
        "maven:com.acme:old-lib": found(
          "com.acme:old-lib",
          "2020-01-01T00:00:00.000Z",
          "maven"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("maven");
    expect(result.findings[0]?.package).toBe("com.acme:new-lib");
    expect(result.findings[0]?.source.file).toBe("pom.xml");
  });

  it("changed-only scans packages introduced in Gradle lockfiles", async () => {
    const rootDir = await tempProject({
      "gradle.lockfile": "com.acme:old-lib:1.0.0=runtimeClasspath\n"
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "gradle.lockfile"),
      [
        "com.acme:old-lib:1.0.0=runtimeClasspath",
        "com.acme:new-lib:1.0.0=runtimeClasspath"
      ].join("\n") + "\n"
    );
    await commitAll(rootDir, "update gradle lockfile");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      now: new Date("2026-06-24T00:00:00.000Z"),
      registryClient: fakeRegistry({
        "maven:com.acme:new-lib": found(
          "com.acme:new-lib",
          "2026-06-22T00:00:00.000Z",
          "maven"
        ),
        "maven:com.acme:old-lib": found(
          "com.acme:old-lib",
          "2020-01-01T00:00:00.000Z",
          "maven"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("maven");
    expect(result.findings[0]?.package).toBe("com.acme:new-lib");
    expect(result.findings[0]?.source.file).toBe("gradle.lockfile");
  });

  it("changed-only scans packages introduced in composer.lock", async () => {
    const rootDir = await tempProject({
      "composer.lock": JSON.stringify({
        packages: [
          {
            name: "example/old-package",
            version: "1.0.0",
            "notification-url": "https://packagist.org/downloads/"
          }
        ]
      })
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "composer.lock"),
      JSON.stringify({
        packages: [
          {
            name: "example/old-package",
            version: "1.0.0",
            "notification-url": "https://packagist.org/downloads/"
          },
          {
            name: "example/new-package",
            version: "1.0.0",
            "notification-url": "https://packagist.org/downloads/"
          },
          {
            name: "example/private-package",
            version: "1.0.0",
            "notification-url": "https://packages.example.invalid/downloads/"
          }
        ]
      })
    );
    await commitAll(rootDir, "update composer lock");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "packagist:example/new-package": {
          status: "not_found",
          ecosystem: "packagist",
          name: "example/new-package"
        },
        "packagist:example/old-package": found(
          "example/old-package",
          "2020-01-01T00:00:00.000Z",
          "packagist"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("packagist");
    expect(result.findings[0]?.package).toBe("example/new-package");
    expect(result.findings[0]?.source.file).toBe("composer.lock");
  });

  it("changed-only scans crates introduced in Cargo.toml", async () => {
    const rootDir = await tempProject({
      "Cargo.toml": `
[dependencies]
old-crate = "1"
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "Cargo.toml"),
      `
[dependencies]
old-crate = "1"
new-crate = "1"
local-crate = { path = "../local-crate" }
`
    );
    await commitAll(rootDir, "update cargo manifest");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "crates:new-crate": {
          status: "not_found",
          ecosystem: "crates",
          name: "new-crate"
        },
        "crates:old-crate": found(
          "old-crate",
          "2020-01-01T00:00:00.000Z",
          "crates"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("crates");
    expect(result.findings[0]?.package).toBe("new-crate");
    expect(result.findings[0]?.source.file).toBe("Cargo.toml");
  });

  it("changed-only scans crates introduced in Cargo.lock", async () => {
    const rootDir = await tempProject({
      "Cargo.lock": `
version = 3

[[package]]
name = "old-crate"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "Cargo.lock"),
      `
version = 3

[[package]]
name = "old-crate"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "new-crate"
version = "1.0.0"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "local-crate"
version = "0.1.0"
`
    );
    await commitAll(rootDir, "update cargo lock");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "crates:new-crate": {
          status: "not_found",
          ecosystem: "crates",
          name: "new-crate"
        },
        "crates:old-crate": found(
          "old-crate",
          "2020-01-01T00:00:00.000Z",
          "crates"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("crates");
    expect(result.findings[0]?.package).toBe("new-crate");
    expect(result.findings[0]?.source.file).toBe("Cargo.lock");
  });

  it("changed-only scans packages introduced in go.mod", async () => {
    const rootDir = await tempProject({
      "go.mod": `
module example.com/service

go 1.24

require github.com/example/old-module v1.0.0
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "go.mod"),
      `
module example.com/service

go 1.24

require (
  github.com/example/old-module v1.0.0
  github.com/example/new-module v1.0.0
  github.com/example/local-module v1.0.0
)

replace github.com/example/local-module => ../local-module
`
    );
    await commitAll(rootDir, "update go mod");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "go:github.com/example/new-module": {
          status: "not_found",
          ecosystem: "go",
          name: "github.com/example/new-module"
        },
        "go:github.com/example/old-module": found(
          "github.com/example/old-module",
          "2020-01-01T00:00:00.000Z",
          "go"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("go");
    expect(result.findings[0]?.package).toBe("github.com/example/new-module");
    expect(result.findings[0]?.source.file).toBe("go.mod");
  });

  it("changed-only scans NuGet packages introduced in project files", async () => {
    const rootDir = await tempProject({
      "src/App/App.csproj": `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Example.Old" Version="1.0.0" />
  </ItemGroup>
</Project>
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "src/App/App.csproj"),
      `
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Example.Old" Version="1.0.0" />
    <PackageReference Include="Example.New" Version="1.0.0" />
  </ItemGroup>
</Project>
`
    );
    await commitAll(rootDir, "update nuget packages");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "nuget:example.new": {
          status: "not_found",
          ecosystem: "nuget",
          name: "example.new"
        },
        "nuget:example.old": found(
          "example.old",
          "2020-01-01T00:00:00.000Z",
          "nuget"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("nuget");
    expect(result.findings[0]?.package).toBe("example.new");
    expect(result.findings[0]?.source.file).toBe("src/App/App.csproj");
  });

  it("changed-only scans RubyGems packages introduced in Gemfile", async () => {
    const rootDir = await tempProject({
      Gemfile: `
source "https://rubygems.org"

gem "old-gem", "1.0.0"
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "Gemfile"),
      `
source "https://rubygems.org"

gem "old-gem", "1.0.0"
gem "new-gem", "1.0.0"
gem "local-gem", path: "../local-gem"
`
    );
    await commitAll(rootDir, "update gemfile");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "rubygems:new-gem": {
          status: "not_found",
          ecosystem: "rubygems",
          name: "new-gem"
        },
        "rubygems:old-gem": found(
          "old-gem",
          "2020-01-01T00:00:00.000Z",
          "rubygems"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("rubygems");
    expect(result.findings[0]?.package).toBe("new-gem");
    expect(result.findings[0]?.source.file).toBe("Gemfile");
  });

  it("changed-only scans packages introduced in pdm.lock", async () => {
    const rootDir = await tempProject({
      "pdm.lock": `
[[package]]
name = "old-python-package"
version = "1.0.0"
groups = ["default"]
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "pdm.lock"),
      `
[[package]]
name = "old-python-package"
version = "1.0.0"
groups = ["default"]

[[package]]
name = "new-python-package"
version = "1.0.0"
groups = ["default"]

[[package]]
name = "local-python-package"
version = "1.0.0"
path = "../local-python-package"
`
    );
    await commitAll(rootDir, "update pdm lock");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "pypi:new-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "new-python-package"
        },
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
    expect(result.findings[0]?.package).toBe("new-python-package");
    expect(result.findings[0]?.source.file).toBe("pdm.lock");
  });

  it("changed-only scans packages introduced in uv.lock", async () => {
    const rootDir = await tempProject({
      "uv.lock": `
version = 1

[[package]]
name = "old-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "uv.lock"),
      `
version = 1

[[package]]
name = "old-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "new-python-package"
version = "1.0.0"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "local-python-package"
version = "1.0.0"
source = { path = "../local-python-package" }
`
    );
    await commitAll(rootDir, "update uv lock");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "pypi:new-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "new-python-package"
        },
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
    expect(result.findings[0]?.package).toBe("new-python-package");
    expect(result.findings[0]?.source.file).toBe("uv.lock");
  });

  it("changed-only scans packages introduced in poetry.lock", async () => {
    const rootDir = await tempProject({
      "poetry.lock": `
[[package]]
name = "old-python-package"
version = "1.0.0"
`
    });

    await initGitRepository(rootDir);
    await writeFile(
      path.join(rootDir, "poetry.lock"),
      `
[[package]]
name = "old-python-package"
version = "1.0.0"

[[package]]
name = "new-python-package"
version = "1.0.0"
`
    );
    await commitAll(rootDir, "update poetry lock");

    const result = await scan({
      rootDir,
      changedOnly: true,
      baseRef: "main",
      registryClient: fakeRegistry({
        "pypi:new-python-package": {
          status: "not_found",
          ecosystem: "pypi",
          name: "new-python-package"
        },
        "pypi:old-python-package": found(
          "old-python-package",
          "2020-01-01T00:00:00.000Z",
          "pypi"
        )
      })
    });

    expect(result.scannedDependencies).toBe(1);
    expect(result.findings[0]?.ecosystem).toBe("pypi");
    expect(result.findings[0]?.package).toBe("new-python-package");
    expect(result.findings[0]?.source.file).toBe("poetry.lock");
  });

  it("deduplicates package references before registry lookup", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          react: "^19.0.0"
        }
      }),
      "package-lock.json": JSON.stringify({
        lockfileVersion: 3,
        packages: {
          "": {},
          "node_modules/react": {
            version: "19.0.0",
            resolved: "https://registry.npmjs.org/react/-/react-19.0.0.tgz"
          }
        }
      })
    });
    const calls: string[] = [];
    const result = await scan({
      rootDir,
      registryClient: {
        getPackage(reference) {
          calls.push(`${reference.ecosystem}:${reference.name}`);
          return Promise.resolve(
            found(reference.name, "2020-01-01T00:00:00.000Z", reference.ecosystem)
          );
        }
      }
    });

    expect(result.scannedDependencies).toBe(1);
    expect(calls).toEqual(["npm:react"]);
  });

  it("limits concurrent registry lookups while preserving deterministic findings", async () => {
    const rootDir = await tempProject({
      "package.json": JSON.stringify({
        dependencies: {
          "delta-package": "^1.0.0",
          "alpha-package": "^1.0.0",
          "charlie-package": "^1.0.0",
          "bravo-package": "^1.0.0"
        }
      })
    });
    let activeRequests = 0;
    let maxActiveRequests = 0;
    const calls: string[] = [];

    const result = await scan({
      rootDir,
      registryConcurrency: 2,
      registryClient: {
        async getPackage(reference) {
          activeRequests += 1;
          maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
          calls.push(`${reference.ecosystem}:${reference.name}`);
          await sleep(20);
          activeRequests -= 1;
          return {
            status: "not_found",
            ecosystem: reference.ecosystem,
            name: reference.name
          };
        }
      }
    });

    expect(maxActiveRequests).toBe(2);
    expect(calls).toEqual([
      "npm:alpha-package",
      "npm:bravo-package",
      "npm:charlie-package",
      "npm:delta-package"
    ]);
    expect(result.findings.map((finding) => finding.package)).toEqual([
      "alpha-package",
      "bravo-package",
      "charlie-package",
      "delta-package"
    ]);
  });
});

async function tempProject(files: Record<string, string>): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sloplock-"));
  tempDirs.push(tempDir);

  await Promise.all(
    Object.entries(files).map(async ([file, content]) => {
      await mkdir(path.dirname(path.join(tempDir, file)), { recursive: true });
      await writeFile(path.join(tempDir, file), content);
    })
  );

  return tempDir;
}

function found(
  name: string,
  firstPublishedAt: string,
  ecosystem: Ecosystem = "npm"
): RegistryResult {
  return {
    status: "found",
    ecosystem,
    name,
    firstPublishedAt: new Date(firstPublishedAt)
  };
}

function fakeRegistry(results: Record<string, RegistryResult>): RegistryClient {
  return {
    getPackage(reference) {
      const result =
        results[`${reference.ecosystem}:${reference.name}`] ??
        results[reference.name];
      if (result === undefined) {
        return Promise.resolve({
          status: "not_found",
          ecosystem: reference.ecosystem,
          name: reference.name
        });
      }

      return Promise.resolve(result);
    }
  };
}

async function git(rootDir: string, args: readonly string[]): Promise<void> {
  await execFileAsync("git", [...args], { cwd: rootDir });
}

async function initGitRepository(rootDir: string): Promise<void> {
  await git(rootDir, ["init", "-b", "main"]);
  await commitAll(rootDir, "base");
  await git(rootDir, ["checkout", "-b", "feature"]);
}

async function commitAll(rootDir: string, message: string): Promise<void> {
  await git(rootDir, ["add", "."]);
  await git(rootDir, [
    "-c",
    "commit.gpgsign=false",
    "-c",
    "user.email=sloplock@example.test",
    "-c",
    "user.name=SlopLock",
    "commit",
    "-m",
    message
  ]);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}
