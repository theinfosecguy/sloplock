import { hookMain } from "./main.js";
void hookMain().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`sloplock hook: ${message}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map