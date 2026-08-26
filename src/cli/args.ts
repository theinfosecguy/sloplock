import {
  Command,
  CommanderError,
  InvalidArgumentError
} from "@commander-js/extra-typings";
import { UsageError } from "../core/errors.js";
import type { Ecosystem, Severity } from "../core/types.js";
import { sloplockVersion } from "../core/version.js";

export type OutputFormat = "text" | "json" | "markdown";

export type CheckArgs = {
  ecosystem: Ecosystem;
  names: string[];
  format: "text" | "json";
  failOn?: Exclude<Severity, "low">;
  config?: string;
  failClosed: boolean;
};

export type CliArgs = {
  path: string;
  format: OutputFormat;
  failOn?: Exclude<Severity, "low">;
  ecosystem?: Ecosystem;
  changedOnly: boolean;
  base?: string;
  config?: string;
  failClosed: boolean;
  hook: boolean;
  check?: CheckArgs;
  help: boolean;
  version: boolean;
};

type ProgramOptions = {
  format: OutputFormat;
  failOn?: Exclude<Severity, "low">;
  ecosystem?: Ecosystem;
  changedOnly: boolean;
  base?: string;
  config?: string;
  failClosed: boolean;
};

export function parseCliArgs(argv: readonly string[]): CliArgs {
  if (hasFlag(argv, "--help", "-h")) {
    return defaultArgs({ help: true });
  }

  if (hasFlag(argv, "--version", "-v")) {
    return defaultArgs({ version: true });
  }

  const state: { hook: boolean; check?: CheckArgs } = { hook: false };
  const program = buildProgram({
    onHook: () => {
      state.hook = true;
    },
    onCheck: (check) => {
      state.check = check;
    }
  });
  let errorOutput = "";

  for (const command of [program, ...program.commands]) {
    command.exitOverride();
    command.configureOutput({
      writeErr: (message) => {
        errorOutput += message;
      }
    });
  }

  try {
    program.parse([...argv], { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      const message = errorOutput.trim() || error.message;
      throw new UsageError(message);
    }

    throw error;
  }

  if (state.hook) {
    return defaultArgs({ hook: true });
  }

  if (state.check !== undefined) {
    return defaultArgs({ check: state.check });
  }

  const options = program.opts();
  const pathArg = program.args[0] ?? ".";

  return {
    path: pathArg,
    format: options.format,
    ...(options.failOn === undefined ? {} : { failOn: options.failOn }),
    ...(options.ecosystem === undefined ? {} : { ecosystem: options.ecosystem }),
    changedOnly: options.changedOnly,
    ...(options.base === undefined ? {} : { base: options.base }),
    ...(options.config === undefined ? {} : { config: options.config }),
    failClosed: options.failClosed,
    hook: false,
    help: false,
    version: false
  };
}

export function helpText(): string {
  return buildProgram({ onHook: () => undefined, onCheck: () => undefined }).helpInformation();
}

function buildProgram(handlers: {
  onHook: () => void;
  onCheck: (check: CheckArgs) => void;
}): Command<[string], ProgramOptions> {
  const program = new Command()
    .name("sloplock")
    .description(
      "Block nonexistent and too-new package dependencies before they enter your repo."
    )
    .argument("[path]", "directory to scan", ".")
    .enablePositionalOptions()
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "display help")
    .version(sloplockVersion, "-v, --version", "print version")
    .option(
      "--format <format>",
      "output format: text, json, or markdown",
      parseFormat,
      "text"
    )
    .option(
      "--fail-on <severity>",
      "minimum severity that fails: medium or high",
      parseFailOn
    )
    .option(
      "--ecosystem <ecosystem>",
      "ecosystem to scan: crates, go, maven, npm, nuget, packagist, pypi, or rubygems",
      parseEcosystem
    )
    .option(
      "--changed-only",
      "scan only dependencies added since --base",
      false
    )
    .option(
      "--base <ref>",
      "base git ref for --changed-only. Default: the remote default branch, or origin/main"
    )
    .option("--config <path>", "config file. Default: sloplock.yml")
    .option("--fail-closed", "exit 3 on registry/network failures", false)
    .action(() => undefined);

  program
    .command("check")
    .description("check package names against their public registry")
    .argument(
      "<ecosystem>",
      "crates, go, maven, npm, nuget, packagist, pypi, or rubygems",
      parseEcosystem
    )
    .argument("<names...>", "package names to check")
    .option("--format <format>", "output format: text or json", parseCheckFormat, "text")
    .option(
      "--fail-on <severity>",
      "minimum severity that fails: medium or high",
      parseFailOn
    )
    .option("--config <path>", "config file. Default: sloplock.yml")
    .option("--fail-closed", "exit 3 on registry/network failures", false)
    .action((ecosystem, names, options) => {
      handlers.onCheck({
        ecosystem,
        names,
        format: options.format,
        ...(options.failOn === undefined ? {} : { failOn: options.failOn }),
        ...(options.config === undefined ? {} : { config: options.config }),
        failClosed: options.failClosed
      });
    });

  program
    .command("hook")
    .description("run as a Claude Code PreToolUse hook: reads the hook event on stdin")
    .allowExcessArguments(false)
    .action(handlers.onHook);

  return program;
}

function parseCheckFormat(value: string): "text" | "json" {
  if (value === "text" || value === "json") {
    return value;
  }

  throw new InvalidArgumentError("must be text or json.");
}

function parseFormat(value: string): OutputFormat {
  if (value === "text" || value === "json" || value === "markdown") {
    return value;
  }

  throw new InvalidArgumentError("must be text, json, or markdown.");
}

function parseFailOn(value: string): "medium" | "high" {
  if (value === "medium" || value === "high") {
    return value;
  }

  throw new InvalidArgumentError("must be medium or high.");
}

function parseEcosystem(value: string): Ecosystem {
  if (
    value === "crates" ||
    value === "go" ||
    value === "maven" ||
    value === "npm" ||
    value === "nuget" ||
    value === "packagist" ||
    value === "pypi" ||
    value === "rubygems"
  ) {
    return value;
  }

  throw new InvalidArgumentError(
    "must be crates, go, maven, npm, nuget, packagist, pypi, or rubygems."
  );
}

function hasFlag(
  argv: readonly string[],
  longFlag: string,
  shortFlag: string
): boolean {
  return argv.some((arg) => arg === longFlag || arg === shortFlag);
}

function defaultArgs(overrides: Partial<CliArgs>): CliArgs {
  return {
    path: ".",
    format: "text",
    changedOnly: false,
    failClosed: false,
    hook: false,
    help: false,
    version: false,
    ...overrides
  };
}
