import { normalizeGoModulePath } from "./go.js";
import { normalizeNpmPackageName } from "./npm.js";
import { normalizePypiPackageName } from "./pypi.js";
import type { Ecosystem } from "./types.js";

export function normalizePackageName(
  ecosystem: Ecosystem,
  packageName: string
): string | undefined {
  switch (ecosystem) {
    case "go":
      return normalizeGoModulePath(packageName);
    case "npm":
      return normalizeNpmPackageName(packageName);
    case "pypi":
      return normalizePypiPackageName(packageName);
  }
}

export function registryDisplayName(ecosystem: Ecosystem): string {
  switch (ecosystem) {
    case "go":
      return "Go module proxy";
    case "npm":
      return "npm";
    case "pypi":
      return "PyPI";
  }
}
