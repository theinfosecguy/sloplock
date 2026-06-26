import { normalizeGoModulePath } from "../core/go.js";
import { makeGoReference } from "./common.js";
export function parseGoMod(options) {
    const requiredModules = [];
    const replacementModules = [];
    const replacedModules = new Set();
    let block;
    const lines = options.content.split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
        const { tokens, comment } = tokenizeGoModLine(line);
        if (tokens.length === 0) {
            continue;
        }
        if (tokens[0] === ")") {
            block = undefined;
            continue;
        }
        if (block !== undefined) {
            if (block === "require") {
                const requiredModule = parseRequireTokens(tokens, comment, index + 1);
                if (requiredModule !== undefined) {
                    requiredModules.push(requiredModule);
                }
            }
            else {
                addReplacement({
                    tokens,
                    sourceLine: index + 1,
                    replacedModules,
                    replacementModules
                });
            }
            continue;
        }
        const directive = tokens[0];
        const directiveTokens = tokens.slice(1);
        if (directiveTokens[0] === "(") {
            if (directive === "require" || directive === "replace") {
                block = directive;
            }
            continue;
        }
        if (directive === "require") {
            const requiredModule = parseRequireTokens(directiveTokens, comment, index + 1);
            if (requiredModule !== undefined) {
                requiredModules.push(requiredModule);
            }
            continue;
        }
        if (directive === "replace") {
            addReplacement({
                tokens: directiveTokens,
                sourceLine: index + 1,
                replacedModules,
                replacementModules
            });
        }
    }
    return {
        references: referencesFromRequiredModules(requiredModules, replacementModules, replacedModules, options.sourceFile),
        warnings: []
    };
}
function referencesFromRequiredModules(requiredModules, replacementModules, replacedModules, sourceFile) {
    const activeModules = [
        ...requiredModules.filter((requiredModule) => !replacedModules.has(requiredModule.modulePath)),
        ...replacementModules
    ];
    const references = activeModules
        .map((requiredModule) => makeGoReference({
        name: requiredModule.modulePath,
        versionRange: requiredModule.version,
        sourceFile,
        sourceLine: requiredModule.sourceLine,
        sourceKind: "manifest",
        isDirect: requiredModule.isDirect
    }));
    return [...new Map(references.map((reference) => [reference.name, reference])).values()];
}
function parseRequireTokens(tokens, comment, sourceLine) {
    const [rawModulePath, version] = tokens;
    if (rawModulePath === undefined || version === undefined) {
        return undefined;
    }
    const modulePath = normalizeGoModulePath(rawModulePath);
    if (modulePath === undefined || !isGoVersion(version)) {
        return undefined;
    }
    return {
        modulePath,
        version,
        sourceLine,
        isDirect: !/\bindirect\b/u.test(comment)
    };
}
function addReplacement(input) {
    const { tokens, sourceLine, replacedModules, replacementModules } = input;
    const arrowIndex = tokens.indexOf("=>");
    const rawModulePath = tokens[0];
    if (arrowIndex < 0 || rawModulePath === undefined) {
        return;
    }
    const modulePath = normalizeGoModulePath(rawModulePath);
    if (modulePath !== undefined) {
        replacedModules.add(modulePath);
    }
    const rawReplacementPath = tokens[arrowIndex + 1];
    const replacementVersion = tokens[arrowIndex + 2];
    if (rawReplacementPath === undefined || replacementVersion === undefined) {
        return;
    }
    const replacementPath = normalizeGoModulePath(rawReplacementPath);
    if (replacementPath === undefined || !isGoVersion(replacementVersion)) {
        return;
    }
    replacementModules.push({
        modulePath: replacementPath,
        version: replacementVersion,
        sourceLine,
        isDirect: true
    });
}
function tokenizeGoModLine(line) {
    const tokens = [];
    let comment = "";
    let current = "";
    let index = 0;
    function pushCurrent() {
        if (current.length > 0) {
            tokens.push(current);
            current = "";
        }
    }
    while (index < line.length) {
        const character = line[index];
        if (character === undefined) {
            break;
        }
        const next = line[index + 1];
        if (character === "/" && next === "/") {
            pushCurrent();
            comment = line.slice(index + 2);
            break;
        }
        if (character === " " || character === "\t") {
            pushCurrent();
            index += 1;
            continue;
        }
        if (character === "(" || character === ")") {
            pushCurrent();
            tokens.push(character);
            index += 1;
            continue;
        }
        if (character === "=" && next === ">") {
            pushCurrent();
            tokens.push("=>");
            index += 2;
            continue;
        }
        if (character === "\"") {
            const parsed = readQuotedString(line, index);
            current += parsed.value;
            index = parsed.nextIndex;
            continue;
        }
        if (character === "`") {
            const parsed = readRawString(line, index);
            current += parsed.value;
            index = parsed.nextIndex;
            continue;
        }
        current += character;
        index += 1;
    }
    pushCurrent();
    return { tokens, comment };
}
function readQuotedString(line, startIndex) {
    let value = "";
    let index = startIndex + 1;
    while (index < line.length) {
        const character = line[index];
        if (character === undefined) {
            break;
        }
        if (character === "\\") {
            const next = line[index + 1];
            if (next !== undefined) {
                value += next;
                index += 2;
                continue;
            }
        }
        if (character === "\"") {
            return { value, nextIndex: index + 1 };
        }
        value += character;
        index += 1;
    }
    return { value, nextIndex: line.length };
}
function readRawString(line, startIndex) {
    const endIndex = line.indexOf("`", startIndex + 1);
    if (endIndex === -1) {
        return {
            value: line.slice(startIndex + 1),
            nextIndex: line.length
        };
    }
    return {
        value: line.slice(startIndex + 1, endIndex),
        nextIndex: endIndex + 1
    };
}
function isGoVersion(input) {
    return /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(input);
}
//# sourceMappingURL=go-mod.js.map