import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const cliPath = path.join(repoRoot, "dist", "cli", "index.js");
const actionPath = path.join(repoRoot, "dist", "action", "index.cjs");
const unique = `${Date.now()}-${process.pid}`;
const tempDir = mkdtempSync(path.join(tmpdir(), "sloplock-ecosystem-smoke-"));
const smokeResults = [];

try {
  const passFixture = createPassFixture(path.join(tempDir, "pass"));
  const missingFixture = createMissingFixture(path.join(tempDir, "missing"));
  const mixedSourceFixture = createMixedSourceFixture(
    path.join(tempDir, "mixed-sources")
  );
  const changedFixture = createChangedOnlyFixture(path.join(tempDir, "changed"));

  const passReport = runCliJson(passFixture, []);
  assertSummary("CLI pass fixture", passReport, {
    findings: 0,
    scannedDependencies: 9
  });
  smokeResults.push(["CLI pass", passReport.summary]);

  const missingResult = runCliJson(missingFixture, [], 1);
  assertSummary("CLI missing fixture", missingResult.report, {
    findings: 8,
    scannedDependencies: 8,
    highestSeverity: "high"
  });
  assertFindingEcosystems("CLI missing fixture", missingResult.report, [
    "crates",
    "go",
    "maven",
    "npm",
    "nuget",
    "packagist",
    "pypi",
    "rubygems"
  ]);
  assertFindingRules("CLI missing fixture", missingResult.report, [
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found"
  ]);
  smokeResults.push(["CLI missing", missingResult.report.summary]);

  const mixedSourceReport = runCliJson(mixedSourceFixture, []);
  assertSummary("CLI mixed public/private/local fixture", mixedSourceReport, {
    findings: 0,
    scannedDependencies: 9,
    warnings: 2
  });
  smokeResults.push([
    "CLI mixed public/private/local",
    mixedSourceReport.summary
  ]);

  const changedResult = runCliJson(
    changedFixture,
    ["--changed-only", "--base", "main"],
    1
  );
  assertSummary("CLI changed-only fixture", changedResult.report, {
    findings: 8,
    scannedDependencies: 9,
    highestSeverity: "high"
  });
  assertFindingEcosystems("CLI changed-only fixture", changedResult.report, [
    "crates",
    "go",
    "maven",
    "npm",
    "nuget",
    "packagist",
    "pypi",
    "rubygems"
  ]);
  assertFindingRules("CLI changed-only fixture", changedResult.report, [
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found",
    "package_not_found"
  ]);
  smokeResults.push(["CLI changed-only", changedResult.report.summary]);

  const actionPass = runAction(passFixture, 0);
  assertActionOutputs("Action pass fixture", actionPass.outputs, {
    findings: "0",
    highestSeverity: ""
  });
  smokeResults.push(["Action pass", actionPass.outputs]);

  const actionMissing = runAction(missingFixture, 1);
  assertActionOutputs("Action missing fixture", actionMissing.outputs, {
    findings: "8",
    highestSeverity: "high"
  });
  smokeResults.push(["Action missing", actionMissing.outputs]);

  const actionMixedSource = runAction(mixedSourceFixture, 0);
  assertActionOutputs(
    "Action mixed public/private/local fixture",
    actionMixedSource.outputs,
    {
      findings: "0",
      highestSeverity: ""
    }
  );
  smokeResults.push([
    "Action mixed public/private/local",
    actionMixedSource.outputs
  ]);

  for (const [name, summary] of smokeResults) {
    process.stdout.write(`${name}: ${JSON.stringify(summary)}\n`);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function createPassFixture(rootDir) {
  mkdirSync(rootDir, { recursive: true });
  writeJson(path.join(rootDir, "package.json"), {
    dependencies: {
      react: "^18.2.0"
    }
  });
  writeFileSync(path.join(rootDir, "requirements.txt"), "requests==2.32.0\n");
  writeFileSync(
    path.join(rootDir, "go.mod"),
    `module github.com/sloplock-smoke/pass

go 1.23

require github.com/stretchr/testify v1.10.0
`
  );
  writeFileSync(
    path.join(rootDir, "Cargo.toml"),
    `[package]
name = "sloplock-smoke-pass"
version = "0.1.0"

[dependencies]
serde = "1"
`
  );
  writeFileSync(
    path.join(rootDir, "pom.xml"),
    `<project>
  <dependencies>
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>2.0.17</version>
    </dependency>
  </dependencies>
</project>
`
  );
  writeFileSync(
    path.join(rootDir, "gradle.lockfile"),
    "com.google.guava:guava:33.4.8-jre=runtimeClasspath\n"
  );
  writeJson(path.join(rootDir, "composer.json"), {
    require: {
      "monolog/monolog": "^3.0"
    }
  });
  writeFileSync(
    path.join(rootDir, "Gemfile"),
    `source "https://rubygems.org"

gem "rake", "~> 13.0"
`
  );
  writeFileSync(
    path.join(rootDir, "App.csproj"),
    `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
`
  );

  return rootDir;
}

function createMissingFixture(rootDir) {
  mkdirSync(rootDir, { recursive: true });
  const packages = missingPackages();
  writeJson(path.join(rootDir, "package.json"), {
    dependencies: {
      [packages.npm]: "^1.0.0"
    }
  });
  writeFileSync(path.join(rootDir, "requirements.txt"), `${packages.pypi}==1.0.0\n`);
  writeFileSync(
    path.join(rootDir, "go.mod"),
    `module github.com/sloplock-smoke/missing

go 1.23

require ${packages.go} v1.0.0
`
  );
  writeFileSync(
    path.join(rootDir, "Cargo.toml"),
    `[package]
name = "sloplock-smoke-missing"
version = "0.1.0"

[dependencies]
${packages.crates} = "1"
`
  );
  writeJson(path.join(rootDir, "composer.json"), {
    require: {
      [packages.packagist]: "1.0.0"
    }
  });
  writeFileSync(
    path.join(rootDir, "pom.xml"),
    `<project>
  <dependencies>
    <dependency>
      <groupId>${packages.mavenGroup}</groupId>
      <artifactId>${packages.mavenArtifact}</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
`
  );
  writeFileSync(
    path.join(rootDir, "Gemfile"),
    `source "https://rubygems.org"

gem "${packages.rubygems}", "1.0.0"
`
  );
  writeFileSync(
    path.join(rootDir, "App.csproj"),
    `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="${packages.nuget}" Version="1.0.0" />
  </ItemGroup>
</Project>
`
  );

  return rootDir;
}

function createMixedSourceFixture(rootDir) {
  mkdirSync(rootDir, { recursive: true });
  writeJson(path.join(rootDir, "package.json"), {
    dependencies: {
      react: "^18.2.0",
      "local-npm-package": "file:../local-npm-package"
    }
  });
  writeFileSync(
    path.join(rootDir, "requirements.txt"),
    [
      "requests==2.32.0",
      "local-python-package @ file:///tmp/local-python-package",
      "git+https://github.com/example/python-package.git",
      "./local-python-package"
    ].join("\n") + "\n"
  );
  writeFileSync(
    path.join(rootDir, "sloplock.yml"),
    `go:
  privateModules:
    - github.com/private-org/*
nuget:
  privatePackages:
    - Private.*
`
  );
  writeFileSync(
    path.join(rootDir, "go.mod"),
    `module github.com/sloplock-smoke/private

go 1.23

require (
  github.com/stretchr/testify v1.10.0
  github.com/private-org/internal-module v1.0.0
)
`
  );
  writeFileSync(
    path.join(rootDir, "Cargo.toml"),
    `[package]
name = "sloplock-smoke-private"
version = "0.1.0"

[dependencies]
serde = "1"
path-crate = { path = "../path-crate" }
git-crate = { git = "https://github.com/example/git-crate" }
private-crate = { version = "1", registry = "private" }
workspace-crate = { workspace = true }
`
  );
  writeFileSync(
    path.join(rootDir, "pom.xml"),
    `<project>
  <repositories>
    <repository>
      <id>private</id>
      <url>https://repo.example.invalid/maven2</url>
    </repository>
  </repositories>
  <dependencies>
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>2.0.17</version>
    </dependency>
    <dependency>
      <groupId>com.sloplock.private</groupId>
      <artifactId>internal-${unique.toLowerCase()}</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
`
  );
  writeJson(path.join(rootDir, "composer.json"), {
    require: {
      "monolog/monolog": "^3.0",
      "private/package": "1.0.0"
    },
    repositories: [
      {
        type: "composer",
        url: "https://packages.example.invalid",
        only: ["private/package"]
      }
    ]
  });
  writeFileSync(
    path.join(rootDir, "Gemfile"),
    `source "https://rubygems.org"

gem "rake", "~> 13.0"
gem "local-gem", path: "../local-gem"

source "https://gems.example.invalid" do
  gem "private-gem", "1.0.0"
end
`
  );
  writeFileSync(
    path.join(rootDir, "NuGet.config"),
    `<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="private" value="https://nuget.example.invalid/v3/index.json" />
  </packageSources>
</configuration>
`
  );
  writeFileSync(
    path.join(rootDir, "App.csproj"),
    `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="Private.Package" Version="1.0.0" />
  </ItemGroup>
</Project>
`
  );

  return rootDir;
}

function createChangedOnlyFixture(rootDir) {
  mkdirSync(rootDir, { recursive: true });
  writeJson(path.join(rootDir, "package.json"), {
    dependencies: {
      react: "^18.2.0"
    }
  });
  writeFileSync(path.join(rootDir, "requirements.txt"), "requests==2.32.0\n");
  writeFileSync(
    path.join(rootDir, "go.mod"),
    `module github.com/sloplock-smoke/changed

go 1.23

require github.com/stretchr/testify v1.10.0
`
  );
  writeFileSync(
    path.join(rootDir, "Cargo.toml"),
    `[package]
name = "sloplock-smoke-changed"
version = "0.1.0"

[dependencies]
serde = "1"
`
  );
  writeJson(path.join(rootDir, "composer.json"), {
    require: {
      "monolog/monolog": "^3.0"
    }
  });
  writeFileSync(
    path.join(rootDir, "pom.xml"),
    `<project>
  <dependencies>
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>2.0.17</version>
    </dependency>
  </dependencies>
</project>
`
  );
  writeFileSync(
    path.join(rootDir, "Gemfile"),
    `source "https://rubygems.org"

gem "rake", "~> 13.0"
`
  );
  writeFileSync(
    path.join(rootDir, "App.csproj"),
    `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
`
  );

  run("git", ["init", "-q", "-b", "main"], { cwd: rootDir });
  run("git", ["add", "."], { cwd: rootDir });
  run(
    "git",
    [
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.email=sloplock@example.test",
      "-c",
      "user.name=SlopLock",
      "commit",
      "-q",
      "-m",
      "base"
    ],
    { cwd: rootDir }
  );
  run("git", ["checkout", "-q", "-b", "feature/smoke"], { cwd: rootDir });

  const packages = missingPackages("changed");
  writeJson(path.join(rootDir, "package.json"), {
    dependencies: {
      react: "^18.2.0",
      [packages.npm]: "^1.0.0"
    }
  });
  writeFileSync(
    path.join(rootDir, "requirements.txt"),
    `requests==2.32.0\n${packages.pypi}==1.0.0\n`
  );
  writeFileSync(
    path.join(rootDir, "go.mod"),
    `module github.com/sloplock-smoke/changed

go 1.23

require (
  github.com/stretchr/testify v1.10.0
  ${packages.go} v1.0.0
)
`
  );
  writeFileSync(
    path.join(rootDir, "Cargo.toml"),
    `[package]
name = "sloplock-smoke-changed"
version = "0.1.0"

[dependencies]
serde = "1"
${packages.crates} = "1"
`
  );
  writeJson(path.join(rootDir, "composer.json"), {
    require: {
      "monolog/monolog": "^3.0",
      [packages.packagist]: "1.0.0"
    }
  });
  writeFileSync(
    path.join(rootDir, "pom.xml"),
    `<project>
  <dependencies>
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>2.0.17</version>
    </dependency>
    <dependency>
      <groupId>${packages.mavenGroup}</groupId>
      <artifactId>${packages.mavenArtifact}</artifactId>
      <version>1.0.0</version>
    </dependency>
  </dependencies>
</project>
`
  );
  writeFileSync(
    path.join(rootDir, "gradle.lockfile"),
    "com.google.guava:guava:33.4.8-jre=runtimeClasspath\n"
  );
  writeFileSync(
    path.join(rootDir, "Gemfile"),
    `source "https://rubygems.org"

gem "rake", "~> 13.0"
gem "${packages.rubygems}", "1.0.0"
`
  );
  writeFileSync(
    path.join(rootDir, "App.csproj"),
    `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageReference Include="${packages.nuget}" Version="1.0.0" />
  </ItemGroup>
</Project>
`
  );
  run("git", ["add", "."], { cwd: rootDir });
  run(
    "git",
    [
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.email=sloplock@example.test",
      "-c",
      "user.name=SlopLock",
      "commit",
      "-q",
      "-m",
      "add missing dependencies"
    ],
    { cwd: rootDir }
  );

  return rootDir;
}

function runCliJson(rootDir, extraArgs, expectedStatus = 0) {
  const result = spawnSync(
    process.execPath,
    [cliPath, rootDir, "--format", "json", ...extraArgs],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );

  if (result.status !== expectedStatus) {
    throw new Error(
      `Expected CLI exit ${expectedStatus}, got ${String(result.status)}.\n` +
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }

  const report = JSON.parse(result.stdout);
  return expectedStatus === 0 ? report : { report, status: result.status };
}

function runAction(rootDir, expectedStatus) {
  const outputFile = path.join(tempDir, `action-output-${safeName(rootDir)}`);
  const summaryFile = path.join(tempDir, `action-summary-${safeName(rootDir)}`);
  writeFileSync(outputFile, "");
  writeFileSync(summaryFile, "");

  const result = spawnSync(process.execPath, [actionPath], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      INPUT_PATH: rootDir,
      INPUT_ECOSYSTEM: "all",
      INPUT_COMMENT: "false",
      "INPUT_CHANGED-ONLY": "false",
      "INPUT_FAIL-CLOSED": "false",
      GITHUB_OUTPUT: outputFile,
      GITHUB_STEP_SUMMARY: summaryFile
    }
  });

  if (result.status !== expectedStatus) {
    throw new Error(
      `Expected action exit ${expectedStatus}, got ${String(result.status)}.\n` +
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }

  return {
    outputs: readActionOutputs(outputFile),
    summary: readFileSync(summaryFile, "utf8")
  };
}

function readActionOutputs(outputFile) {
  const outputs = {};
  const lines = readFileSync(outputFile, "utf8").split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.length === 0) {
      continue;
    }

    const heredoc = /^(.*?)<<(.*)$/u.exec(line);
    if (heredoc !== null) {
      const [, key, delimiter] = heredoc;
      const valueLines = [];
      index += 1;
      while (index < lines.length && lines[index] !== delimiter) {
        valueLines.push(lines[index]);
        index += 1;
      }
      outputs[key] = valueLines.join("\n");
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex !== -1) {
      outputs[line.slice(0, equalsIndex)] = line.slice(equalsIndex + 1);
    }
  }

  return outputs;
}

function assertSummary(name, report, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (report.summary?.[key] !== value) {
      throw new Error(
        `${name}: expected summary.${key}=${String(value)}, ` +
          `got ${String(report.summary?.[key])} in ${JSON.stringify(report.summary)}`
      );
    }
  }
}

function assertFindingRules(name, report, rules) {
  const actualRules = report.findings
    .map((finding) => finding.rule)
    .sort();
  const expectedRules = [...rules].sort();
  if (JSON.stringify(actualRules) !== JSON.stringify(expectedRules)) {
    throw new Error(
      `${name}: expected finding rules ${JSON.stringify(expectedRules)}, ` +
        `got ${JSON.stringify(actualRules)}`
    );
  }
}

function assertFindingEcosystems(name, report, ecosystems) {
  const actualEcosystems = report.findings
    .map((finding) => finding.ecosystem)
    .sort();
  const expectedEcosystems = [...ecosystems].sort();
  if (JSON.stringify(actualEcosystems) !== JSON.stringify(expectedEcosystems)) {
    throw new Error(
      `${name}: expected finding ecosystems ${JSON.stringify(expectedEcosystems)}, ` +
        `got ${JSON.stringify(actualEcosystems)}`
    );
  }
}

function assertActionOutputs(name, outputs, expected) {
  const actualHighest = outputs["highest-severity"] ?? "";
  if (outputs.findings !== expected.findings) {
    throw new Error(
      `${name}: expected action findings=${expected.findings}, ` +
        `got ${String(outputs.findings)}`
    );
  }

  if (actualHighest !== expected.highestSeverity) {
    throw new Error(
      `${name}: expected action highest-severity=${expected.highestSeverity}, ` +
        `got ${actualHighest}`
    );
  }
}

function missingPackages(label = "missing") {
  const suffix = `${label}-${unique}`.toLowerCase();
  const mavenGroup = "com.sloplock.smoke";
  const mavenArtifact = `missing-${suffix}`;
  return {
    maven: `${mavenGroup}:${mavenArtifact}`,
    mavenGroup,
    mavenArtifact,
    npm: `sloplock-smoke-npm-${suffix}`,
    nuget: `SlopLock.Smoke.Missing.${suffix.replaceAll("-", ".")}`,
    pypi: `sloplock-smoke-pypi-${suffix}`,
    go: `github.com/sloplock-smoke/missing-go-${suffix}`,
    packagist: `sloplock-smoke/missing-${suffix}`,
    rubygems: `sloplock-smoke-missing-${suffix}`,
    crates: `sloplock_smoke_crate_${suffix.replaceAll("-", "_")}`.slice(0, 64)
  };
}

function safeName(input) {
  return path.basename(input).replace(/[^a-z0-9_-]/giu, "_");
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function run(command, args, options) {
  execFileSync(command, args, {
    stdio: "ignore",
    ...options
  });
}
