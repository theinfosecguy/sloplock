import { normalizeCratesPackageName } from "./crates.js";
import { normalizeGoModulePath } from "./go.js";
import { normalizeMavenPackageName } from "./maven.js";
import { normalizeNugetPackageName } from "./nuget.js";
import { normalizeNpmPackageName } from "./npm.js";
import { normalizePackagistPackageName } from "./packagist.js";
import { normalizePypiPackageName } from "./pypi.js";
import { normalizeRubygemsPackageName } from "./rubygems.js";
import type { Ecosystem } from "./types.js";

export function normalizePackageName(
  ecosystem: Ecosystem,
  packageName: string
): string | undefined {
  switch (ecosystem) {
    case "crates":
      return normalizeCratesPackageName(packageName);
    case "go":
      return normalizeGoModulePath(packageName);
    case "maven":
      return normalizeMavenPackageName(packageName);
    case "npm":
      return normalizeNpmPackageName(packageName);
    case "nuget":
      return normalizeNugetPackageName(packageName);
    case "packagist":
      return normalizePackagistPackageName(packageName);
    case "pypi":
      return normalizePypiPackageName(packageName);
    case "rubygems":
      return normalizeRubygemsPackageName(packageName);
  }
}

// Drops a trailing version specifier in the form each ecosystem's tooling
// accepts on the command line: `express@4`, `requests==2.32.0`, `serde@1`,
// `github.com/x/y@v1.2.0`, `vendor/pkg:^1.0`, `rake:13`, `Foo.Bar@1.0`, and
// `group:artifact:1.0`.
export function stripVersionSpec(ecosystem: Ecosystem, spec: string): string {
  switch (ecosystem) {
    case "npm": {
      const at = spec.indexOf("@", spec.startsWith("@") ? 1 : 0);
      return at === -1 ? spec : spec.slice(0, at);
    }
    case "pypi":
      return spec.split(/[[=<>!~;@]/u)[0] ?? spec;
    case "crates":
    case "go":
    case "nuget":
      return spec.split("@")[0] ?? spec;
    case "rubygems":
    case "packagist":
      return spec.split(/[:=]/u)[0] ?? spec;
    case "maven":
      return spec.split(":").slice(0, 2).join(":");
  }
}

export function registryDisplayName(ecosystem: Ecosystem): string {
  switch (ecosystem) {
    case "crates":
      return "crates.io";
    case "go":
      return "Go module proxy";
    case "maven":
      return "Maven Central";
    case "npm":
      return "npm";
    case "nuget":
      return "NuGet.org";
    case "packagist":
      return "Packagist";
    case "pypi":
      return "PyPI";
    case "rubygems":
      return "RubyGems.org";
  }
}
