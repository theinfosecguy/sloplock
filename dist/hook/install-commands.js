import path from "node:path";
import { matchesGoPrivateModulePattern, splitGoPrivatePatternList } from "../core/go.js";
import { normalizePackageName, stripVersionSpec } from "../core/packages.js";
const shellPrefixes = new Set([
    "sudo",
    "env",
    "command",
    "exec",
    "nohup",
    "time",
    "if",
    "then",
    "else",
    "elif",
    "do",
    "while",
    "until",
    "!",
    "{"
]);
const prefixesWithFlags = new Set(["sudo", "env", "nohup", "time"]);
const sudoValueFlags = new Set(["-u", "--user", "-g", "--group", "-h", "--host"]);
const envAssignment = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/su;
const publicRegistryHosts = new Set([
    "registry.npmjs.org",
    "registry.npmjs.com",
    "registry.yarnpkg.com",
    "pypi.org",
    "pypi.python.org",
    "files.pythonhosted.org",
    "proxy.golang.org",
    "goproxy.io",
    "goproxy.cn",
    "crates.io",
    "index.crates.io",
    "static.crates.io",
    "rubygems.org",
    "index.rubygems.org",
    "api.nuget.org",
    "nuget.org",
    "www.nuget.org",
    "packagist.org",
    "repo.packagist.org"
]);
const publicRegistryNames = new Set(["crates-io", "nuget.org", "pypi", "direct", "off"]);
const nonPublic = (value) => value
    .split(/[\s,|]+/u)
    .filter((entry) => entry.length > 0)
    .some((entry) => !isPublicRegistry(entry));
const anyValue = (value) => value.trim().length > 0;
const registryVariables = {
    NPM_CONFIG_REGISTRY: { ecosystem: "npm", overrides: nonPublic },
    YARN_REGISTRY: { ecosystem: "npm", overrides: nonPublic },
    YARN_NPM_REGISTRY_SERVER: { ecosystem: "npm", overrides: nonPublic },
    PIP_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
    PIP_EXTRA_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
    PIP_FIND_LINKS: { ecosystem: "pypi", overrides: anyValue },
    UV_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
    UV_EXTRA_INDEX_URL: { ecosystem: "pypi", overrides: nonPublic },
    UV_DEFAULT_INDEX: { ecosystem: "pypi", overrides: nonPublic },
    UV_INDEX: { ecosystem: "pypi", overrides: nonPublic },
    UV_FIND_LINKS: { ecosystem: "pypi", overrides: anyValue },
    CARGO_REGISTRY_DEFAULT: { ecosystem: "crates", overrides: nonPublic },
    GOPROXY: { ecosystem: "go", overrides: nonPublic }
};
const goPrivateVariables = new Set(["GOPRIVATE", "GONOPROXY"]);
const nodeFlags = {
    value: new Set([
        "-w",
        "--workspace",
        "--prefix",
        "-C",
        "--cwd",
        "--filter",
        "--tag",
        "--save-prefix",
        "--loglevel",
        "--userconfig",
        "--cache"
    ]),
    source: new Set(["--registry"])
};
const npxFlags = {
    value: new Set(["-c", "--call", "--shell", "--shell-auto-fallback"]),
    source: nodeFlags.source
};
const npxPackageFlags = {
    replacing: new Set(["-p", "--package"]),
    additional: new Set()
};
const pipFlags = {
    value: new Set([
        "-r",
        "--requirement",
        "-c",
        "--constraint",
        "-e",
        "--editable",
        "-t",
        "--target",
        "--platform",
        "--python-version",
        "--implementation",
        "--abi",
        "--root",
        "--prefix",
        "--src",
        "-b",
        "--build",
        "--proxy",
        "--timeout",
        "--retries",
        "--trusted-host",
        "--cert",
        "--client-cert",
        "--cache-dir",
        "--log",
        "--config-settings",
        "-C",
        "--report",
        "--progress-bar",
        "--python",
        "-p",
        "--group",
        "-G",
        "--extra",
        "-E",
        "--extras",
        "--package",
        "--project",
        "--directory",
        "-P",
        "--rev",
        "--tag",
        "--branch",
        "--pip-args",
        "--with-requirements",
        "--with-editable"
    ]),
    source: new Set([
        "--git",
        "--path",
        "--url",
        "-i",
        "--index-url",
        "--extra-index-url",
        "-f",
        "--find-links",
        "--no-index",
        "--index",
        "--default-index",
        "--source"
    ])
};
const uvxPackageFlags = {
    replacing: new Set(["--from", "--spec"]),
    additional: new Set(["-w", "--with"])
};
const cargoFlags = {
    value: new Set([
        "--features",
        "-F",
        "--rename",
        "--branch",
        "--tag",
        "--rev",
        "--target",
        "--target-dir",
        "-p",
        "--package",
        "--manifest-path",
        "-C",
        "--version",
        "--vers",
        "--root",
        "-j",
        "--jobs",
        "--config",
        "-Z",
        "--profile",
        "--color"
    ]),
    source: new Set(["--git", "--path", "--registry", "--index"])
};
const goFlags = {
    value: new Set([
        "-tags",
        "-ldflags",
        "-gcflags",
        "-asmflags",
        "-gccgoflags",
        "-mod",
        "-modfile",
        "-overlay",
        "-C",
        "-o",
        "-p",
        "-toolexec",
        "-buildmode",
        "-compiler",
        "-installsuffix",
        "-pkgdir",
        "-buildvcs",
        "-covermode",
        "-coverpkg"
    ]),
    source: new Set()
};
const gemFlags = {
    value: new Set([
        "-v",
        "--version",
        "-i",
        "--install-dir",
        "-n",
        "--bindir",
        "--platform",
        "--http-proxy",
        "--config-file",
        "-g",
        "--group",
        "-r",
        "--require",
        "--branch",
        "--ref",
        "--glob"
    ]),
    source: new Set(["--git", "--github", "--path", "-s", "--source", "--clear-sources", "-l", "--local"])
};
const composerFlags = {
    value: new Set([
        "-d",
        "--working-dir",
        "--with",
        "--prefer-install",
        "--audit-format",
        "--apcu-autoloader-prefix"
    ]),
    source: new Set()
};
const dotnetFlags = {
    value: new Set(["-v", "--version", "-f", "--framework", "--package-directory", "--project"]),
    source: new Set(["-s", "--source"])
};
const goThreeElementHosts = new Set([
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "codeberg.org",
    "golang.org"
]);
const goTwoElementHosts = new Set([
    "gopkg.in",
    "google.golang.org",
    "k8s.io",
    "sigs.k8s.io",
    "go.uber.org"
]);
export function extractInstallPackages(command, env = process.env) {
    const seen = new Set();
    const packages = [];
    const variables = new Map();
    for (const [name, value] of Object.entries(env)) {
        if (value !== undefined) {
            setVariable(variables, name, value);
        }
    }
    for (const tokens of splitCommands(command)) {
        const { tokens: commandTokens, assignments } = stripPrefixes(tokens);
        const [program, ...rest] = commandTokens;
        if (program === undefined) {
            for (const [name, value] of assignments) {
                variables.set(name, value);
            }
            continue;
        }
        if (program === "export" || program === "declare" || program === "typeset") {
            for (const token of rest) {
                const match = envAssignment.exec(token);
                if (match?.[1] !== undefined && match[2] !== undefined) {
                    setVariable(variables, match[1], match[2]);
                }
            }
            continue;
        }
        if (program === "unset") {
            for (const token of rest) {
                variables.delete(token.toUpperCase());
            }
            continue;
        }
        const extracted = extractFromCommand(commandTokens);
        if (extracted === undefined) {
            continue;
        }
        const effective = new Map([...variables, ...assignments]);
        if (usesAlternateRegistry(extracted.ecosystem, effective)) {
            continue;
        }
        const goPrivatePatterns = extracted.ecosystem === "go"
            ? [...goPrivateVariables].flatMap((name) => splitGoPrivatePatternList(effective.get(name)))
            : [];
        for (const raw of extracted.names) {
            const name = registryName(extracted.ecosystem, raw);
            const key = `${extracted.ecosystem}:${name ?? ""}`;
            if (name === undefined ||
                seen.has(key) ||
                goPrivatePatterns.some((pattern) => matchesGoPrivateModulePattern(name, pattern))) {
                continue;
            }
            seen.add(key);
            packages.push({ ecosystem: extracted.ecosystem, name });
        }
    }
    return packages;
}
function setVariable(variables, name, value) {
    const upper = name.toUpperCase();
    if (upper in registryVariables || goPrivateVariables.has(upper)) {
        variables.set(upper, value);
    }
}
function usesAlternateRegistry(ecosystem, variables) {
    return Object.entries(registryVariables).some(([name, rule]) => {
        const value = variables.get(name);
        return rule.ecosystem === ecosystem && value !== undefined && rule.overrides(value);
    });
}
function isPublicRegistry(value) {
    const trimmed = value.trim().toLowerCase();
    if (publicRegistryNames.has(trimmed)) {
        return true;
    }
    try {
        return publicRegistryHosts.has(new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).hostname);
    }
    catch {
        return false;
    }
}
// Splits a shell command line into simple commands. Handles quotes, escapes,
// `&& || ; |` and newline separators, subshells, `$(...)` and backtick
// substitutions (including inside double quotes and unquoted heredoc bodies),
// comments, backslash-newline continuations, heredoc bodies, and here-strings.
function splitCommands(command) {
    const commands = [];
    const frames = [];
    const heredocs = [];
    let tokens = [];
    let current = "";
    let hasToken = false;
    let quote;
    const endToken = () => {
        if (hasToken) {
            tokens.push(current);
        }
        current = "";
        hasToken = false;
    };
    const endCommand = () => {
        endToken();
        if (tokens.length > 0) {
            commands.push(stripRedirections(tokens));
        }
        tokens = [];
    };
    const suspend = (kind) => {
        endCommand();
        frames.push({ quote, kind, depth: 1 });
        quote = undefined;
    };
    const resume = () => {
        const frame = frames.pop();
        quote = frame?.quote;
        hasToken = quote !== undefined;
    };
    for (let index = 0; index < command.length; index += 1) {
        const char = command[index] ?? "";
        const next = command[index + 1];
        const frame = frames.at(-1);
        if (quote === "'") {
            if (char === "'") {
                quote = undefined;
            }
            else {
                current += char;
            }
            continue;
        }
        if (quote === '"') {
            if (char === '"') {
                quote = undefined;
            }
            else if (char === "\\" && next === "\n") {
                index += 1;
            }
            else if (char === "\\" && next !== undefined) {
                current += next;
                index += 1;
            }
            else if (char === "$" && next === "(") {
                suspend("paren");
                index += 1;
            }
            else if (char === "`") {
                suspend("backtick");
            }
            else {
                current += char;
            }
            continue;
        }
        if (char === "#" && !hasToken) {
            while (index + 1 < command.length && command[index + 1] !== "\n") {
                index += 1;
            }
        }
        else if (char === "'" || char === '"') {
            quote = char;
            hasToken = true;
        }
        else if (char === "\\" && next === "\n") {
            index += 1;
        }
        else if (char === "\\" && next !== undefined) {
            current += next;
            hasToken = true;
            index += 1;
        }
        else if (char === "$" && next === "(") {
            suspend("paren");
            index += 1;
        }
        else if (char === "(") {
            endCommand();
            if (frame?.kind === "paren") {
                frame.depth += 1;
            }
        }
        else if (char === ")") {
            endCommand();
            if (frame?.kind === "paren") {
                frame.depth -= 1;
                if (frame.depth === 0) {
                    resume();
                }
            }
        }
        else if (char === "`") {
            if (frame?.kind === "backtick") {
                endCommand();
                resume();
            }
            else {
                suspend("backtick");
            }
        }
        else if (char === "<" && next === "<" && command[index + 2] === "<") {
            endToken();
            tokens.push("<<<");
            index += 2;
        }
        else if (char === "<" && next === "<") {
            endToken();
            index = readHeredocOperator(command, index, heredocs);
        }
        else if (char === "\n") {
            endCommand();
            if (heredocs.length > 0) {
                const bodies = skipHeredocBodies(command, index, heredocs.splice(0));
                index = bodies.position;
                for (const body of bodies.expanded) {
                    for (const source of substitutions(body)) {
                        commands.push(...splitCommands(source));
                    }
                }
            }
        }
        else if (char === "&" || char === "|" || char === ";") {
            endCommand();
        }
        else if (char === " " || char === "\t" || char === "\r") {
            endToken();
        }
        else {
            current += char;
            hasToken = true;
        }
    }
    endCommand();
    return commands;
}
// Parses `<<`, `<<-`, and the delimiter word starting at `start`; returns the
// index of the last consumed character. A quoted or escaped delimiter means the
// body is literal; otherwise the shell expands substitutions inside it.
function readHeredocOperator(command, start, heredocs) {
    let index = start + 2;
    const stripTabs = command[index] === "-";
    if (stripTabs) {
        index += 1;
    }
    while (command[index] === " " || command[index] === "\t") {
        index += 1;
    }
    const open = command[index];
    if (open === "'" || open === '"') {
        const close = command.indexOf(open, index + 1);
        const end = close === -1 ? command.length : close;
        heredocs.push({ delimiter: command.slice(index + 1, end), stripTabs, expands: false });
        return end;
    }
    const escaped = open === "\\";
    if (escaped) {
        index += 1;
    }
    const delimiter = /^[^\s;&|()<>`]*/u.exec(command.slice(index))?.[0] ?? "";
    heredocs.push({ delimiter, stripTabs, expands: !escaped });
    return delimiter.length === 0 ? index - 1 : index + delimiter.length - 1;
}
// Consumes heredoc bodies following the newline at `newline`. Returns the
// index of the newline that ends the last delimiter line and the bodies of
// heredocs whose delimiter was unquoted.
function skipHeredocBodies(command, newline, heredocs) {
    const expanded = [];
    let position = newline;
    for (const heredoc of heredocs) {
        const lines = [];
        while (position < command.length) {
            const lineStart = position + 1;
            const lineEnd = command.indexOf("\n", lineStart);
            const line = command.slice(lineStart, lineEnd === -1 ? command.length : lineEnd);
            position = lineEnd === -1 ? command.length : lineEnd;
            if ((heredoc.stripTabs ? line.replace(/^\t+/u, "") : line) === heredoc.delimiter) {
                break;
            }
            lines.push(line);
        }
        if (heredoc.expands) {
            expanded.push(lines.join("\n"));
        }
    }
    return { position, expanded };
}
// Returns the source of every `$(...)` and backtick substitution in text the
// shell would expand.
function substitutions(text) {
    const sources = [];
    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (char === "\\") {
            index += 1;
        }
        else if (char === "$" && text[index + 1] === "(") {
            const end = closingParen(text, index + 1);
            sources.push(text.slice(index + 2, end));
            index = end;
        }
        else if (char === "`") {
            const end = closingBacktick(text, index + 1);
            sources.push(text.slice(index + 1, end));
            index = end;
        }
    }
    return sources;
}
function closingParen(text, open) {
    let depth = 0;
    let quote;
    for (let index = open; index < text.length; index += 1) {
        const char = text[index];
        if (quote !== undefined) {
            if (char === quote) {
                quote = undefined;
            }
            else if (char === "\\") {
                index += 1;
            }
        }
        else if (char === "'" || char === '"') {
            quote = char;
        }
        else if (char === "\\") {
            index += 1;
        }
        else if (char === "(") {
            depth += 1;
        }
        else if (char === ")") {
            depth -= 1;
            if (depth === 0) {
                return index;
            }
        }
    }
    return text.length;
}
function closingBacktick(text, start) {
    for (let index = start; index < text.length; index += 1) {
        if (text[index] === "\\") {
            index += 1;
        }
        else if (text[index] === "`") {
            return index;
        }
    }
    return text.length;
}
function stripRedirections(tokens) {
    const result = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index] ?? "";
        if (/^\d*[<>]{1,3}$/u.test(token) || token === "&>") {
            index += 1;
            continue;
        }
        if (/^\d*[<>]/u.test(token) || token.startsWith("&>")) {
            continue;
        }
        result.push(token);
    }
    return result;
}
function stripPrefixes(tokens) {
    const remaining = [...tokens];
    const assignments = new Map();
    const note = (token) => {
        const match = envAssignment.exec(token);
        if (match?.[1] === undefined || match[2] === undefined) {
            return false;
        }
        setVariable(assignments, match[1], match[2]);
        return true;
    };
    while (remaining.length > 0) {
        const first = remaining[0] ?? "";
        if (note(first)) {
            remaining.shift();
            continue;
        }
        if (!shellPrefixes.has(first)) {
            break;
        }
        remaining.shift();
        while (remaining.length > 0) {
            const token = remaining[0] ?? "";
            if (first === "sudo" && sudoValueFlags.has(token)) {
                remaining.splice(0, 2);
            }
            else if (first === "env" && note(token)) {
                remaining.shift();
            }
            else if (prefixesWithFlags.has(first) && token.startsWith("-") && token.length > 1) {
                remaining.shift();
            }
            else {
                break;
            }
        }
    }
    return { tokens: remaining, assignments };
}
function extractFromCommand(tokens) {
    const [program = "", ...args] = tokens;
    switch (path.posix.basename(program)) {
        case "npm":
            return subcommand(args, nodeFlags, { install: "npm", i: "npm", add: "npm" });
        case "pnpm":
        case "yarn":
        case "bun":
            return (subcommand(args, nodeFlags, { install: "npm", i: "npm", add: "npm" }) ??
                runner(args, npxFlags, { dlx: "npm", x: "npm" }, npxPackageFlags));
        case "npx":
        case "bunx":
            return runnerPackages(args, npxFlags, "npm", npxPackageFlags);
        case "pip":
        case "pip3":
            return subcommand(args, pipFlags, { install: "pypi" }, pipNames);
        case "python":
        case "python3":
        case "py":
            return args[0] === "-m" && args[1] === "pip"
                ? subcommand(args.slice(2), pipFlags, { install: "pypi" }, pipNames)
                : undefined;
        case "uv":
            if (args[0] === "pip" || args[0] === "tool") {
                return (subcommand(args.slice(1), pipFlags, { install: "pypi" }, pipNames) ??
                    runner(args.slice(1), pipFlags, { run: "pypi" }, uvxPackageFlags));
            }
            return subcommand(args, pipFlags, { add: "pypi" }, pipNames);
        case "uvx":
            return runnerPackages(args, pipFlags, "pypi", uvxPackageFlags);
        case "pipx":
            return (subcommand(args, pipFlags, { install: "pypi" }, pipNames) ??
                runner(args, pipFlags, { run: "pypi" }, uvxPackageFlags));
        case "poetry":
        case "pdm":
            return subcommand(args, pipFlags, { add: "pypi" }, pipNames);
        case "cargo":
            return subcommand(args, cargoFlags, { add: "crates", install: "crates" });
        case "go":
            return subcommand(args, goFlags, { get: "go", install: "go" });
        case "gem":
            return subcommand(args, gemFlags, { install: "rubygems", i: "rubygems" });
        case "bundle":
        case "bundler":
            return subcommand(args, gemFlags, { add: "rubygems" });
        case "composer":
            return subcommand(args, composerFlags, { require: "packagist", req: "packagist", r: "packagist" });
        case "dotnet":
            return dotnetPackages(args);
        default:
            return undefined;
    }
}
function subcommand(args, flags, subcommands, refine = (names) => names) {
    const positionals = positionalArguments(args, flags);
    const [first, ...names] = positionals ?? [];
    const ecosystem = first === undefined ? undefined : subcommands[first];
    return ecosystem === undefined ? undefined : { ecosystem, names: refine(names) };
}
function runner(args, flags, subcommands, packageFlags) {
    const [first, ...rest] = args;
    const ecosystem = first === undefined ? undefined : subcommands[first];
    return ecosystem === undefined ? undefined : runnerPackages(rest, flags, ecosystem, packageFlags);
}
function runnerPackages(args, flags, ecosystem, packageFlags) {
    const positionals = positionalArguments(args, {
        value: new Set([...flags.value, ...packageFlags.replacing, ...packageFlags.additional]),
        source: flags.source
    });
    if (positionals === undefined) {
        return undefined;
    }
    const replacing = flagValues(args, packageFlags.replacing);
    return {
        ecosystem,
        names: [
            ...flagValues(args, packageFlags.additional),
            ...(replacing.length > 0 ? replacing : positionals.slice(0, 1))
        ]
    };
}
function dotnetPackages(args) {
    const positionals = positionalArguments(args, dotnetFlags);
    if (positionals === undefined) {
        return undefined;
    }
    const [first, second, third] = positionals;
    if (first === "add") {
        const index = positionals.indexOf("package");
        const name = index === -1 ? undefined : positionals[index + 1];
        return name === undefined ? undefined : { ecosystem: "nuget", names: [name] };
    }
    if (first === "package" && second === "add" && third !== undefined) {
        return { ecosystem: "nuget", names: [third] };
    }
    return undefined;
}
function pipNames(names) {
    const result = [];
    for (let index = 0; index < names.length; index += 1) {
        if (names[index] === "@") {
            result.pop();
            index += 1;
            continue;
        }
        result.push(names[index] ?? "");
    }
    return result;
}
// Returns positional arguments, or undefined when a source flag points the
// command somewhere other than a public registry.
function positionalArguments(args, flags) {
    const positionals = [];
    for (let index = 0; index < args.length; index += 1) {
        const token = args[index] ?? "";
        if (token === "--") {
            positionals.push(...args.slice(index + 1));
            break;
        }
        if (token.startsWith("-") && token.length > 1) {
            const [flag = "", inline] = token.split(/=(.*)/su);
            if (flags.source.has(flag)) {
                const value = inline ?? args[index + 1];
                if (value === undefined || !isPublicRegistry(value)) {
                    return undefined;
                }
            }
            if (inline === undefined && (flags.value.has(flag) || flags.source.has(flag))) {
                index += 1;
            }
            continue;
        }
        positionals.push(token);
    }
    return positionals;
}
function flagValues(args, flags) {
    const values = [];
    for (let index = 0; index < args.length; index += 1) {
        const token = args[index] ?? "";
        const [flag = "", inline] = token.split(/=(.*)/su);
        if (!flags.has(flag)) {
            continue;
        }
        const value = inline ?? args[index + 1];
        if (inline === undefined) {
            index += 1;
        }
        if (value !== undefined) {
            values.push(value);
        }
    }
    return values;
}
function registryName(ecosystem, raw) {
    const spec = ecosystem === "npm" && raw.includes("@npm:") ? raw.slice(raw.indexOf("@npm:") + 5) : raw;
    if (looksNonRegistry(spec)) {
        return undefined;
    }
    const name = stripVersionSpec(ecosystem, spec);
    if (ecosystem === "npm" && name.includes("/") && !name.startsWith("@")) {
        return undefined;
    }
    if (ecosystem === "pypi" && name.includes("/")) {
        return undefined;
    }
    return normalizePackageName(ecosystem, ecosystem === "go" ? goModuleGuess(name) : name);
}
// ponytail: `go get` accepts package paths, but the module proxy only answers
// for module paths. Reducing to the conventional module root on well-known
// hosts covers the common cases; the upgrade path is walking parent paths in
// the Go registry client the way `go get` itself does.
function goModuleGuess(modulePath) {
    const elements = modulePath.split("/");
    const host = elements[0] ?? "";
    if (goThreeElementHosts.has(host)) {
        return elements.slice(0, 3).join("/");
    }
    if (goTwoElementHosts.has(host)) {
        return elements.slice(0, 2).join("/");
    }
    return modulePath;
}
function looksNonRegistry(spec) {
    return (spec.length === 0 ||
        spec === "." ||
        spec === ".." ||
        spec.startsWith("./") ||
        spec.startsWith("../") ||
        spec.startsWith("/") ||
        spec.startsWith("~") ||
        spec.includes("://") ||
        spec.includes("\\") ||
        /^(git\+|git@|file:|link:|workspace:|github:|gitlab:|bitbucket:|gist:)/iu.test(spec) ||
        /\.(tgz|tar\.gz|tar|zip|whl|gem|nupkg|crate)$/iu.test(spec));
}
//# sourceMappingURL=install-commands.js.map