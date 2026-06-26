import { SaxesParser } from "saxes";
import { isMavenCentralRepositoryUrl, isUnresolvedMavenValue, normalizeMavenPackageName } from "../core/maven.js";
import { makeMavenReference } from "./common.js";
export function parsePomXml(options) {
    const root = parsePomTree(options);
    if (root?.name !== "project") {
        return { references: [], warnings: [] };
    }
    const registrySource = pomDeclaresCustomRepository(root)
        ? "ambiguous-custom-repository"
        : "known-public";
    const references = [
        ...directDependencyNodes(root),
        ...importBomDependencyNodes(root)
    ].flatMap((dependency) => referenceFromDependency(dependency, options.sourceFile, registrySource));
    return { references: dedupeReferences(references), warnings: [] };
}
function parsePomTree(options) {
    const parser = new SaxesParser();
    const stack = [];
    let root;
    let parseError;
    parser.on("opentag", (tag) => {
        const node = {
            name: localName(tag.name),
            text: "",
            line: parser.line,
            children: []
        };
        const parent = stack[stack.length - 1];
        if (parent === undefined) {
            root = node;
        }
        else {
            parent.children.push(node);
        }
        stack.push(node);
    });
    parser.on("text", (text) => {
        const node = stack[stack.length - 1];
        if (node !== undefined) {
            node.text += text;
        }
    });
    parser.on("cdata", (text) => {
        const node = stack[stack.length - 1];
        if (node !== undefined) {
            node.text += text;
        }
    });
    parser.on("closetag", () => {
        stack.pop();
    });
    parser.on("error", (error) => {
        parseError = error;
    });
    try {
        parser.write(options.content).close();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid XML in ${options.sourceFile}: ${message}`);
    }
    if (parseError !== undefined) {
        throw new Error(`Invalid XML in ${options.sourceFile}: ${parseError.message}`);
    }
    return root;
}
function directDependencyNodes(project) {
    return child(project, "dependencies")?.children.filter(isDependencyNode) ?? [];
}
function importBomDependencyNodes(project) {
    const dependencyManagement = child(project, "dependencyManagement");
    const dependencies = dependencyManagement === undefined
        ? undefined
        : child(dependencyManagement, "dependencies");
    return (dependencies?.children.filter(isDependencyNode) ?? []).filter(isImportBomDependency);
}
function referenceFromDependency(dependency, sourceFile, registrySource) {
    const groupId = childText(dependency, "groupId");
    const artifactId = childText(dependency, "artifactId");
    const version = childText(dependency, "version");
    const scope = childText(dependency, "scope")?.toLowerCase();
    const type = childText(dependency, "type")?.toLowerCase();
    if (groupId === undefined ||
        artifactId === undefined ||
        [groupId, artifactId, version, scope, type].some(isUnresolvedMavenValue) ||
        scope === "system" ||
        version?.toLowerCase().includes("snapshot") === true) {
        return [];
    }
    const name = normalizeMavenPackageName(`${groupId}:${artifactId}`);
    if (name === undefined) {
        return [];
    }
    return [
        makeMavenReference({
            name,
            ...versionRangeInput(version),
            sourceFile,
            sourceLine: dependency.line,
            sourceKind: "manifest",
            isDirect: true,
            registrySource
        })
    ];
}
function isImportBomDependency(dependency) {
    return (childText(dependency, "scope")?.toLowerCase() === "import" &&
        childText(dependency, "type")?.toLowerCase() === "pom");
}
function pomDeclaresCustomRepository(project) {
    const repositories = child(project, "repositories")?.children.filter((node) => node.name === "repository");
    if (repositories === undefined) {
        return false;
    }
    return repositories.some((repository) => {
        const url = childText(repository, "url");
        return url === undefined || !isMavenCentralRepositoryUrl(url);
    });
}
function isDependencyNode(node) {
    return node.name === "dependency";
}
function child(node, name) {
    return node.children.find((candidate) => candidate.name === name);
}
function childText(node, name) {
    const text = child(node, name)?.text.trim();
    return text === undefined || text.length === 0 ? undefined : text;
}
function versionRangeInput(version) {
    return version === undefined ? {} : { versionRange: version };
}
function localName(name) {
    return name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name;
}
function dedupeReferences(references) {
    return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
//# sourceMappingURL=maven.js.map