import path from "node:path";
import { normalizePackageName } from "../core/packages.js";
import type { Ecosystem, PackageCheckInput } from "../core/types.js";

type Extracted = { ecosystem: Ecosystem; names: readonly string[] };

const commandPrefixes = new Set(["sudo", "env", "command", "exec", "nohup", "time"]);
const sudoValueFlags = new Set(["-u", "--user", "-g", "--group", "-h", "--host"]);
const envAssignment = /^[A-Za-z_][A-Za-z0-9_]*=/u;

const nodeValueFlags = new Set([
  "--registry",
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
]);
const npxValueFlags = new Set(["-c", "--call", "--shell", "--shell-auto-fallback"]);
const npxPackageFlags = new Set(["-p", "--package"]);
const pipValueFlags = new Set([
  "-r",
  "--requirement",
  "-c",
  "--constraint",
  "-e",
  "--editable",
  "-i",
  "--index-url",
  "--extra-index-url",
  "-f",
  "--find-links",
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
  "--index",
  "--default-index",
  "--package",
  "--project",
  "--directory",
  "-P",
  "--source",
  "--rev",
  "--tag",
  "--branch",
  "--pip-args",
  "--spec"
]);
const pipSourceFlags = new Set(["--git", "--path", "--url"]);
const uvxPackageFlags = new Set(["--from", "--with", "--spec"]);
const cargoValueFlags = new Set([
  "--features",
  "-F",
  "--rename",
  "--branch",
  "--tag",
  "--rev",
  "--registry",
  "--index",
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
]);
const cargoSourceFlags = new Set(["--git", "--path"]);
const goValueFlags = new Set([
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
]);
const gemValueFlags = new Set([
  "-v",
  "--version",
  "-s",
  "--source",
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
]);
const gemSourceFlags = new Set(["--git", "--github", "--path"]);
const composerValueFlags = new Set([
  "-d",
  "--working-dir",
  "--with",
  "--prefer-install",
  "--audit-format",
  "--apcu-autoloader-prefix"
]);
const dotnetValueFlags = new Set([
  "-v",
  "--version",
  "-f",
  "--framework",
  "-s",
  "--source",
  "--package-directory",
  "--project"
]);

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
    const extracted = extractFromCommand(stripPrefixes(tokens));
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
      } else if (char === "\\" && quote === '"' && next !== undefined) {
        current += next;
        index += 1;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      hasToken = true;
    } else if (char === "\\" && next !== undefined) {
      current += next;
      hasToken = true;
      index += 1;
    } else if (char === "&" || char === "|" || char === ";" || char === "\n") {
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
    if (/^\d*[<>]{1,2}$/u.test(token) || /^&?>/u.test(token)) {
      if (/^\d*[<>]{1,2}$/u.test(token) || token === "&>") {
        index += 1;
      }
      continue;
    }
    if (/^\d*[<>]/u.test(token)) {
      continue;
    }
    result.push(token);
  }
  return result;
}

function stripPrefixes(tokens: readonly string[]): string[] {
  const remaining = [...tokens];

  while (remaining.length > 0) {
    const first = remaining[0] ?? "";
    if (envAssignment.test(first)) {
      remaining.shift();
      continue;
    }

    if (!commandPrefixes.has(first)) {
      break;
    }

    remaining.shift();
    while (remaining.length > 0) {
      const token = remaining[0] ?? "";
      if (first === "sudo" && sudoValueFlags.has(token)) {
        remaining.splice(0, 2);
      } else if (token.startsWith("-") || (first === "env" && envAssignment.test(token))) {
        remaining.shift();
      } else {
        break;
      }
    }
  }

  return remaining;
}

function extractFromCommand(tokens: readonly string[]): Extracted | undefined {
  const [program = "", ...args] = tokens;
  switch (path.posix.basename(program)) {
    case "npm":
      return subcommand(args, nodeValueFlags, {
        install: "npm",
        i: "npm",
        add: "npm"
      });
    case "pnpm":
    case "yarn":
    case "bun":
      return (
        subcommand(args, nodeValueFlags, { install: "npm", i: "npm", add: "npm" }) ??
        firstPositional(args, nodeValueFlags, { dlx: "npm", x: "npm" })
      );
    case "npx":
    case "bunx":
      return firstPositionalOf(args, npxValueFlags, "npm", npxPackageFlags);
    case "pip":
    case "pip3":
      return subcommand(args, pipValueFlags, { install: "pypi" }, pipSourceFlags, pipNames);
    case "python":
    case "python3":
    case "py":
      return args[0] === "-m" && args[1] === "pip"
        ? subcommand(args.slice(2), pipValueFlags, { install: "pypi" }, pipSourceFlags, pipNames)
        : undefined;
    case "uv":
      if (args[0] === "pip" || args[0] === "tool") {
        return (
          subcommand(args.slice(1), pipValueFlags, { install: "pypi" }, pipSourceFlags, pipNames) ??
          firstPositional(args.slice(1), pipValueFlags, { run: "pypi" }, uvxPackageFlags)
        );
      }
      return subcommand(args, pipValueFlags, { add: "pypi" }, pipSourceFlags, pipNames);
    case "uvx":
      return firstPositionalOf(args, pipValueFlags, "pypi", uvxPackageFlags);
    case "pipx":
      return (
        subcommand(args, pipValueFlags, { install: "pypi" }, pipSourceFlags, pipNames) ??
        firstPositional(args, pipValueFlags, { run: "pypi" }, uvxPackageFlags)
      );
    case "poetry":
    case "pdm":
      return subcommand(args, pipValueFlags, { add: "pypi" }, pipSourceFlags, pipNames);
    case "cargo":
      return subcommand(args, cargoValueFlags, { add: "crates", install: "crates" }, cargoSourceFlags);
    case "go":
      return subcommand(args, goValueFlags, { get: "go", install: "go" });
    case "gem":
      return subcommand(args, gemValueFlags, { install: "rubygems", i: "rubygems" });
    case "bundle":
    case "bundler":
      return subcommand(args, gemValueFlags, { add: "rubygems" }, gemSourceFlags);
    case "composer":
      return subcommand(args, composerValueFlags, { require: "packagist", req: "packagist", r: "packagist" });
    case "dotnet":
      return dotnetPackages(args);
    default:
      return undefined;
  }
}

function subcommand(
  args: readonly string[],
  valueFlags: ReadonlySet<string>,
  subcommands: Record<string, Ecosystem>,
  sourceFlags: ReadonlySet<string> = new Set(),
  refine: (names: readonly string[]) => readonly string[] = (names) => names
): Extracted | undefined {
  const positionals = positionalArguments(args, valueFlags, sourceFlags);
  const [first, ...names] = positionals ?? [];
  const ecosystem = first === undefined ? undefined : subcommands[first];
  return ecosystem === undefined ? undefined : { ecosystem, names: refine(names) };
}

function firstPositional(
  args: readonly string[],
  valueFlags: ReadonlySet<string>,
  subcommands: Record<string, Ecosystem>,
  packageFlags: ReadonlySet<string> = new Set()
): Extracted | undefined {
  const [first, ...rest] = args;
  const ecosystem = first === undefined ? undefined : subcommands[first];
  return ecosystem === undefined
    ? undefined
    : firstPositionalOf(rest, valueFlags, ecosystem, packageFlags);
}

function firstPositionalOf(
  args: readonly string[],
  valueFlags: ReadonlySet<string>,
  ecosystem: Ecosystem,
  packageFlags: ReadonlySet<string>
): Extracted {
  const flagged = flagValues(args, packageFlags);
  if (flagged.length > 0) {
    return { ecosystem, names: flagged };
  }
  const positionals = positionalArguments(args, new Set([...valueFlags, ...packageFlags]));
  return { ecosystem, names: (positionals ?? []).slice(0, 1) };
}

function dotnetPackages(args: readonly string[]): Extracted | undefined {
  const positionals = positionalArguments(args, dotnetValueFlags) ?? [];
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

function positionalArguments(
  args: readonly string[],
  valueFlags: ReadonlySet<string>,
  sourceFlags: ReadonlySet<string> = new Set()
): string[] | undefined {
  const positionals: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? "";
    if (token === "--") {
      positionals.push(...args.slice(index + 1));
      break;
    }
    if (token.startsWith("-") && token.length > 1) {
      const flag = token.split("=")[0] ?? token;
      if (sourceFlags.has(flag)) {
        return undefined;
      }
      if (!token.includes("=") && valueFlags.has(flag)) {
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
