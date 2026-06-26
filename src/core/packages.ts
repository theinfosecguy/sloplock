import { normalizeNpmPackageName } from "./npm.js";
import { normalizePypiPackageName } from "./pypi.js";
import type { Ecosystem } from "./types.js";

export function normalizePackageName(
  ecosystem: Ecosystem,
  packageName: string
): string | undefined {
  switch (ecosystem) {
    case "npm":
      return normalizeNpmPackageName(packageName);
    case "pypi":
      return normalizePypiPackageName(packageName);
  }
}

export function registryDisplayName(ecosystem: Ecosystem): string {
  switch (ecosystem) {
    case "npm":
      return "npm";
    case "pypi":
      return "PyPI";
  }
}
