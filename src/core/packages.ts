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
