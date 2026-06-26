import { normalizeCratesPackageName } from "./crates.js";
import { normalizeNpmPackageName } from "./npm.js";
import { normalizePypiPackageName } from "./pypi.js";
import type { Ecosystem } from "./types.js";

export function normalizePackageName(
  ecosystem: Ecosystem,
  packageName: string
): string | undefined {
  switch (ecosystem) {
    case "crates":
      return normalizeCratesPackageName(packageName);
    case "npm":
      return normalizeNpmPackageName(packageName);
    case "pypi":
      return normalizePypiPackageName(packageName);
  }
}

export function registryDisplayName(ecosystem: Ecosystem): string {
  switch (ecosystem) {
    case "crates":
      return "crates.io";
    case "npm":
      return "npm";
    case "pypi":
      return "PyPI";
  }
}
