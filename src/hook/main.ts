import { text } from "node:stream/consumers";
import { runHook } from "./run-hook.js";

export async function hookMain(): Promise<void> {
  const outcome = await runHook({
    stdin: await text(process.stdin),
    cwd: process.cwd()
  });

  process.stdout.write(outcome.stdout);
  process.stderr.write(outcome.stderr);
  process.exitCode = outcome.exitCode;
}
