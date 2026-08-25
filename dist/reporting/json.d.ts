import type { ScanResult } from "../core/types.js";
export declare function renderJson(result: ScanResult): string;
export declare function renderJsonError(error: {
    code: string;
    message: string;
    hint?: string;
}): string;
