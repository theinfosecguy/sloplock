import {
  Command,
  CommanderError,
  InvalidArgumentError
} from "@commander-js/extra-typings";
import { UsageError } from "../core/errors.js";
import type { Ecosystem, Severity } from "../core/types.js";

export type OutputFormat = "text" | "json" | "markdown";

export type CliArgs = {
  path: string;
  format: OutputFormat;
  failOn?: Exclude<Severity, "low">;
  ecosystem?: Ecosystem;
  changedOnly: boolean;
  base?: string;
  config?: string;
  failClosed: boolean;
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

  const program = buildProgram();
  let errorOutput = "";

  program.exitOverride();
  program.configureOutput({
    writeErr: (message) => {
      errorOutput += message;
    }
  });

  try {
    program.parse([...argv], { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      const message = errorOutput.trim() || error.message;
      throw new UsageError(message);
    }

    throw error;
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
    help: false,
    version: false
  };
}

export function helpText(): string {
  return buildProgram().helpInformation();
}

function buildProgram(): Command<[string], ProgramOptions> {
  return new Command()
    .name("sloplock")
    .description(
      "Block nonexistent and too-new package dependencies before they enter your repo."
    )
    .argument("[path]", "directory to scan", ".")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "display help")
    .version("0.1.0", "-v, --version", "print version")
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
      "ecosystem to scan: crates, go, npm, nuget, packagist, pypi, or rubygems",
      parseEcosystem
    )
    .option(
      "--changed-only",
      "scan only dependencies added since --base",
      false
    )
    .option("--base <ref>", "base git ref for --changed-only")
    .option("--config <path>", "config file. Default: sloplock.yml")
    .option("--fail-closed", "exit 3 on registry/network failures", false);
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
    value === "npm" ||
    value === "nuget" ||
    value === "packagist" ||
    value === "pypi" ||
    value === "rubygems"
  ) {
    return value;
  }

  throw new InvalidArgumentError(
    "must be crates, go, npm, nuget, packagist, pypi, or rubygems."
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
    help: false,
    version: false,
    ...overrides
  };
}
