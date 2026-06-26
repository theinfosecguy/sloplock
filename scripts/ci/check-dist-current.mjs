import { execFileSync } from "node:child_process";
import process from "node:process";

const changedFiles = lines(git(["diff", "--name-only", "--", "dist"]));
const untrackedFiles = lines(
  git(["ls-files", "--others", "--exclude-standard", "--", "dist"])
);

if (changedFiles.length > 0 || untrackedFiles.length > 0) {
  process.stderr.write(
    [
      "Generated dist/ artifacts are not current.",
      "",
      ...section("changed tracked files", changedFiles),
      ...section("untracked files", untrackedFiles),
      "",
      "Run npm run build and commit the generated dist/ changes in a dedicated generated-artifact refresh PR."
    ].join("\n")
  );
  process.stderr.write("\n");
  process.exit(1);
}

process.stdout.write("Generated dist/ artifacts are current.\n");

function git(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    process.stderr.write("Unable to inspect dist/ artifacts.\n");
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exit(2);
  }
}

function lines(output) {
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function section(title, files) {
  if (files.length === 0) {
    return [];
  }

  return [title, ...files.map((file) => `  - ${file}`), ""];
}
