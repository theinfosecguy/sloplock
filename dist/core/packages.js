import { normalizeNpmPackageName } from "./npm.js";
import { normalizePypiPackageName } from "./pypi.js";
export function normalizePackageName(ecosystem, packageName) {
    switch (ecosystem) {
        case "npm":
            return normalizeNpmPackageName(packageName);
        case "pypi":
            return normalizePypiPackageName(packageName);
    }
}
export function registryDisplayName(ecosystem) {
    switch (ecosystem) {
        case "npm":
            return "npm";
        case "pypi":
            return "PyPI";
    }
}
//# sourceMappingURL=packages.js.map