import path from "node:path";
import { parseComposerJson } from "./composer-json.js";
import { parseComposerLock } from "./composer-lock.js";
import { parseCargoLock } from "./cargo-lock.js";
import { parseCargoToml } from "./cargo-toml.js";
import { parseGemfile } from "./gemfile.js";
import { parseGemfileLock } from "./gemfile-lock.js";
import { parseGoMod } from "./go-mod.js";
import { parseGradleLockfile } from "./gradle-lockfile.js";
import { parsePomXml } from "./maven.js";
import { parseDirectoryPackagesProps, parseMsBuildProject, parsePackagesConfig, parsePackagesLockJson } from "./nuget.js";
import { parsePackageJson } from "./package-json.js";
import { parsePackageLock } from "./package-lock.js";
import { parsePdmLock } from "./pdm-lock.js";
import { parsePoetryLock } from "./poetry-lock.js";
import { parsePnpmLock } from "./pnpm-lock.js";
import { parsePyproject } from "./pyproject.js";
import { parsePythonRequirements } from "./python-requirements.js";
import { parseUvLock } from "./uv-lock.js";
import { parseYarnLock } from "./yarn-lock.js";
const supportedFileNames = new Set([
    "Cargo.lock",
    "Cargo.toml",
    "composer.json",
    "composer.lock",
    "Gemfile",
    "Gemfile.lock",
    "buildscript-gradle.lockfile",
    "go.mod",
    "gradle.lockfile",
    "Directory.Packages.props",
    "package.json",
    "package-lock.json",
    "packages.config",
    "packages.lock.json",
    "pdm.lock",
    "pom.xml",
    "poetry.lock",
    "pnpm-lock.yaml",
    "pyproject.toml",
    "requirements.txt",
    "uv.lock",
    "yarn.lock"
]);
export function isSupportedDependencyFile(filePath) {
    const fileName = path.basename(filePath);
    return (supportedFileNames.has(fileName) ||
        isPythonRequirementsFile(fileName) ||
        isMsBuildProjectFile(fileName));
}
export function parseDependencyFile(input) {
    const parsed = input.format === "python-requirements"
        ? parsePythonRequirements({
            sourceFile: input.sourceFile,
            content: input.content
        })
        : parseByFileName(path.basename(input.sourceFile), input.sourceFile, input.content);
    return {
        references: parsed.references,
        warnings: parsed.warnings.map((message) => ({
            file: input.sourceFile,
            message
        })),
        ...(parsed.includedFiles === undefined ? {} : { includedFiles: parsed.includedFiles })
    };
}
function parseByFileName(fileName, sourceFile, content) {
    if (isPythonRequirementsFile(fileName)) {
        return parsePythonRequirements({ sourceFile, content });
    }
    switch (fileName) {
        case "Cargo.lock":
            return parseCargoLock({ sourceFile, content });
        case "Cargo.toml":
            return parseCargoToml({ sourceFile, content });
        case "composer.json":
            return parseComposerJson({ sourceFile, content });
        case "composer.lock":
            return parseComposerLock({ sourceFile, content });
        case "Gemfile":
            return parseGemfile({ sourceFile, content });
        case "Gemfile.lock":
            return parseGemfileLock({ sourceFile, content });
        case "buildscript-gradle.lockfile":
        case "gradle.lockfile":
            return parseGradleLockfile({ sourceFile, content });
        case "go.mod":
            return parseGoMod({ sourceFile, content });
        case "pom.xml":
            return parsePomXml({ sourceFile, content });
        case "Directory.Packages.props":
            return parseDirectoryPackagesProps({ sourceFile, content });
        case "package.json":
            return parsePackageJson({ sourceFile, content });
        case "package-lock.json":
            return parsePackageLock({ sourceFile, content });
        case "packages.config":
            return parsePackagesConfig({ sourceFile, content });
        case "packages.lock.json":
            return parsePackagesLockJson({ sourceFile, content });
        case "pdm.lock":
            return parsePdmLock({ sourceFile, content });
        case "poetry.lock":
            return parsePoetryLock({ sourceFile, content });
        case "pnpm-lock.yaml":
            return parsePnpmLock({ sourceFile, content });
        case "pyproject.toml":
            return parsePyproject({ sourceFile, content });
        case "uv.lock":
            return parseUvLock({ sourceFile, content });
        case "yarn.lock":
            return parseYarnLock({ sourceFile, content });
        default:
            if (isMsBuildProjectFile(fileName)) {
                return parseMsBuildProject({ sourceFile, content });
            }
            return { references: [], warnings: [] };
    }
}
function isPythonRequirementsFile(fileName) {
    return (/^requirements(?:[-_.][A-Za-z0-9_.-]+)?\.txt$/u.test(fileName) ||
        /^[A-Za-z0-9_.-]+[-_.]requirements\.txt$/u.test(fileName) ||
        /^constraints(?:[-_.][A-Za-z0-9_.-]+)?\.txt$/u.test(fileName) ||
        /^[A-Za-z0-9_.-]+[-_.]constraints\.txt$/u.test(fileName));
}
function isMsBuildProjectFile(fileName) {
    return /\.csproj$/iu.test(fileName);
}
//# sourceMappingURL=index.js.map