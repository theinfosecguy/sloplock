import path from "node:path";
import { normalizePackageName } from "../core/packages.js";
import type { Ecosystem, PackageCheckInput } from "../core/types.js";

type Extracted = { ecosystem: Ecosystem; names: readonly string[] };

type Flags = {
  // Flags that consume the following token.
  value: ReadonlySet<string>;
  // Flags that point the command at a non-public source; the command is skipped.
  source: ReadonlySet<string>;
};

type PackageFlags = {
  // Flags whose value replaces the positional package (`npx -p`, `uvx --from`).
  replacing: ReadonlySet<string>;
  // Flags whose value is installed in addition to the positional (`uvx --with`).
  additional: ReadonlySet<string>;
};

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
const envAssignment = /^[A-Za-z_][A-Za-z0-9_]*=/u;
const registryVariables = new Set([
  "NPM_CONFIG_REGISTRY",
  "YARN_REGISTRY",
  "YARN_NPM_REGISTRY_SERVER",
  "PIP_INDEX_URL",
  "PIP_EXTRA_INDEX_URL",
  "UV_INDEX_URL",
  "UV_EXTRA_INDEX_URL",
  "UV_DEFAULT_INDEX",
  "UV_INDEX",
  "CARGO_REGISTRY_DEFAULT",
  "GOPROXY",
  "GOPRIVATE",
  "GONOPROXY"
]);

const nodeFlags: Flags = {
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
const npxFlags: Flags = {
  value: new Set(["-c", "--call", "--shell", "--shell-auto-fallback"]),
  source: nodeFlags.source
};
const npxPackageFlags: PackageFlags = {
  replacing: new Set(["-p", "--package"]),
  additional: new Set()
};
const pipFlags: Flags = {
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
    "--pip-args"
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
const uvxPackageFlags: PackageFlags = {
  replacing: new Set(["--from", "--spec"]),
  additional: new Set(["--with"])
};
const cargoFlags: Flags = {
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
const goFlags: Flags = {
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
const gemFlags: Flags = {
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
const composerFlags: Flags = {
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
const dotnetFlags: Flags = {
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

export function extractInstallPackages(command: string): PackageCheckInput[] {
  const seen = new Set<string>();
  const packages: PackageCheckInput[] = [];

  for (const tokens of splitCommands(command)) {
    const { tokens: commandTokens, alternateSource } = stripPrefixes(tokens);
    const extracted = alternateSource ? undefined : extractFromCommand(commandTokens);
    if (extracted === undefined) {
      continue;
    }

    for (const raw of extracted.names) {
      const name = registryName(extracted.ecosystem, raw);
      const key = `${extracted.ecosystem}:${name ?? ""}`;
      if (name === undefined || seen.has(key)) {
        continue;
      }

      seen.add(key);
      packages.push({ ecosystem: extracted.ecosystem, name });
    }
  }

  return packages;
}

// Splits a shell command line into simple commands on unquoted operators,
// subshell parentheses, backticks, and newlines; drops comments; joins
// backslash-newline continuations; strips quotes from tokens.
function splitCommands(command: string): string[][] {
  const commands: string[][] = [];
  let tokens: string[] = [];
  let current = "";
  let hasToken = false;
  let quote: "'" | '"' | undefined;

  const endToken = (): void => {
    if (hasToken) {
      tokens.push(current);
    }
    current = "";
    hasToken = false;
  };
  const endCommand = (): void => {
    endToken();
    if (tokens.length > 0) {
      commands.push(stripRedirections(tokens));
    }
    tokens = [];
  };

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index] ?? "";
    const next = command[index + 1];

    if (quote !== undefined) {
      if (char === quote) {
        quote = undefined;
      } else if (quote === '"' && char === "\\" && next === "\n") {
        index += 1;
      } else if (quote === '"' && char === "\\" && next !== undefined) {
        current += next;
        index += 1;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "#" && !hasToken) {
      while (index + 1 < command.length && command[index + 1] !== "\n") {
        index += 1;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
      hasToken = true;
    } else if (char === "\\" && next === "\n") {
      index += 1;
    } else if (char === "\\" && next !== undefined) {
      current += next;
      hasToken = true;
      index += 1;
    } else if ("&|;\n()`".includes(char)) {
      endCommand();
    } else if (char === " " || char === "\t" || char === "\r") {
      endToken();
    } else {
      current += char;
      hasToken = true;
    }
  }

  endCommand();
  return commands;
}

function stripRedirections(tokens: readonly string[]): string[] {
  const result: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    if (/^\d*[<>]{1,2}$/u.test(token) || token === "&>") {
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

function stripPrefixes(tokens: readonly string[]): {
  tokens: string[];
  alternateSource: boolean;
} {
  const remaining = [...tokens];
  let alternateSource = false;

  while (remaining.length > 0) {
    const first = remaining[0] ?? "";
    if (envAssignment.test(first)) {
      alternateSource = alternateSource || isRegistryVariable(first);
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
      } else if (first === "env" && envAssignment.test(token)) {
        alternateSource = alternateSource || isRegistryVariable(token);
        remaining.shift();
      } else if (prefixesWithFlags.has(first) && token.startsWith("-") && token.length > 1) {
        remaining.shift();
      } else {
        break;
      }
    }
  }

  return { tokens: remaining, alternateSource };
}

function isRegistryVariable(assignment: string): boolean {
  const name = (assignment.split("=")[0] ?? "").toUpperCase();
  return registryVariables.has(name) || name.startsWith("CARGO_REGISTRIES_");
}

function extractFromCommand(tokens: readonly string[]): Extracted | undefined {
  const [program = "", ...args] = tokens;
  switch (path.posix.basename(program)) {
    case "npm":
      return subcommand(args, nodeFlags, { install: "npm", i: "npm", add: "npm" });
    case "pnpm":
    case "yarn":
    case "bun":
      return (
        subcommand(args, nodeFlags, { install: "npm", i: "npm", add: "npm" }) ??
        runner(args, npxFlags, { dlx: "npm", x: "npm" }, npxPackageFlags)
      );
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
        return (
          subcommand(args.slice(1), pipFlags, { install: "pypi" }, pipNames) ??
          runner(args.slice(1), pipFlags, { run: "pypi" }, uvxPackageFlags)
        );
      }
      return subcommand(args, pipFlags, { add: "pypi" }, pipNames);
    case "uvx":
      return runnerPackages(args, pipFlags, "pypi", uvxPackageFlags);
    case "pipx":
      return (
        subcommand(args, pipFlags, { install: "pypi" }, pipNames) ??
        runner(args, pipFlags, { run: "pypi" }, uvxPackageFlags)
      );
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

function subcommand(
  args: readonly string[],
  flags: Flags,
  subcommands: Record<string, Ecosystem>,
  refine: (names: readonly string[]) => readonly string[] = (names) => names
): Extracted | undefined {
  const positionals = positionalArguments(args, flags);
  const [first, ...names] = positionals ?? [];
  const ecosystem = first === undefined ? undefined : subcommands[first];
  return ecosystem === undefined ? undefined : { ecosystem, names: refine(names) };
}

function runner(
  args: readonly string[],
  flags: Flags,
  subcommands: Record<string, Ecosystem>,
  packageFlags: PackageFlags
): Extracted | undefined {
  const [first, ...rest] = args;
  const ecosystem = first === undefined ? undefined : subcommands[first];
  return ecosystem === undefined ? undefined : runnerPackages(rest, flags, ecosystem, packageFlags);
}

function runnerPackages(
  args: readonly string[],
  flags: Flags,
  ecosystem: Ecosystem,
  packageFlags: PackageFlags
): Extracted | undefined {
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

function dotnetPackages(args: readonly string[]): Extracted | undefined {
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

function pipNames(names: readonly string[]): string[] {
  const result: string[] = [];
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

function positionalArguments(args: readonly string[], flags: Flags): string[] | undefined {
  const positionals: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? "";
    if (token === "--") {
      positionals.push(...args.slice(index + 1));
      break;
    }
    if (token.startsWith("-") && token.length > 1) {
      const flag = token.split("=")[0] ?? token;
      if (flags.source.has(flag)) {
        return undefined;
      }
      if (!token.includes("=") && flags.value.has(flag)) {
        index += 1;
      }
      continue;
    }
    positionals.push(token);
  }
  return positionals;
}

function flagValues(args: readonly string[], flags: ReadonlySet<string>): string[] {
  const values: string[] = [];
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

function registryName(ecosystem: Ecosystem, raw: string): string | undefined {
  const spec = ecosystem === "npm" && raw.includes("@npm:") ? raw.slice(raw.indexOf("@npm:") + 5) : raw;
  if (looksNonRegistry(spec)) {
    return undefined;
  }

  const name = stripVersion(ecosystem, spec);
  if (ecosystem === "npm" && name.includes("/") && !name.startsWith("@")) {
    return undefined;
  }
  if (ecosystem === "pypi" && name.includes("/")) {
    return undefined;
  }

  return normalizePackageName(ecosystem, ecosystem === "go" ? goModuleGuess(name) : name);
}

function stripVersion(ecosystem: Ecosystem, spec: string): string {
  switch (ecosystem) {
    case "npm": {
      const at = spec.indexOf("@", spec.startsWith("@") ? 1 : 0);
      return at === -1 ? spec : spec.slice(0, at);
    }
    case "pypi":
      return spec.split(/[[=<>!~;@]/u)[0] ?? spec;
    case "crates":
    case "go":
      return spec.split("@")[0] ?? spec;
    case "rubygems":
    case "packagist":
      return spec.split(/[:=]/u)[0] ?? spec;
    case "maven":
    case "nuget":
      return spec;
  }
}

// ponytail: `go get` accepts package paths, but the module proxy only answers
// for module paths. Reducing to the conventional module root on well-known
// hosts covers the common cases; the upgrade path is walking parent paths in
// the Go registry client the way `go get` itself does.
function goModuleGuess(modulePath: string): string {
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

function looksNonRegistry(spec: string): boolean {
  return (
    spec.length === 0 ||
    spec === "." ||
    spec === ".." ||
    spec.startsWith("./") ||
    spec.startsWith("../") ||
    spec.startsWith("/") ||
    spec.startsWith("~") ||
    spec.includes("://") ||
    spec.includes("\\") ||
    /^(git\+|git@|file:|link:|workspace:|github:|gitlab:|bitbucket:|gist:)/iu.test(spec) ||
    /\.(tgz|tar\.gz|tar|zip|whl|gem|nupkg|crate)$/iu.test(spec)
  );
}
