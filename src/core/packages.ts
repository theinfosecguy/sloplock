import { normalizeCratesPackageName } from "./crates.js";
import { normalizeGoModulePath } from "./go.js";
import { normalizeNpmPackageName } from "./npm.js";
import { normalizePackagistPackageName } from "./packagist.js";
import { normalizePypiPackageName } from "./pypi.js";
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
    case "npm":
      return normalizeNpmPackageName(packageName);
    case "packagist":
      return normalizePackagistPackageName(packageName);
    case "pypi":
      return normalizePypiPackageName(packageName);
  }
}

export function registryDisplayName(ecosystem: Ecosystem): string {
  switch (ecosystem) {
    case "crates":
      return "crates.io";
    case "go":
      return "Go module proxy";
    case "npm":
      return "npm";
    case "packagist":
      return "Packagist";
    case "pypi":
      return "PyPI";
  }
}
