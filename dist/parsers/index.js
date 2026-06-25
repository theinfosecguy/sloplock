import path from "node:path";
import { parsePackageJson } from "./package-json.js";
import { parsePackageLock } from "./package-lock.js";
import { parsePnpmLock } from "./pnpm-lock.js";
import { parseYarnLock } from "./yarn-lock.js";
const supportedFileNames = new Set([
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock"
]);
export function isSupportedDependencyFile(filePath) {
    return supportedFileNames.has(path.basename(filePath));
}
export function parseDependencyFile(input) {
    const fileName = path.basename(input.sourceFile);
    const parsed = parseByFileName(fileName, input.sourceFile, input.content);
    return {
        references: parsed.references,
        warnings: parsed.warnings.map((message) => ({
            file: input.sourceFile,
            message
        }))
    };
}
function parseByFileName(fileName, sourceFile, content) {
    switch (fileName) {
        case "package.json":
            return parsePackageJson({ sourceFile, content });
        case "package-lock.json":
            return parsePackageLock({ sourceFile, content });
        case "pnpm-lock.yaml":
            return parsePnpmLock({ sourceFile, content });
        case "yarn.lock":
            return parseYarnLock({ sourceFile, content });
        default:
            return { references: [], warnings: [] };
    }
}
//# sourceMappingURL=index.js.map