import type { ScanResult } from "../core/types.js";
export declare const stickyCommentMarker = "<!-- sloplock-comment -->";
export declare function renderMarkdown(result: ScanResult): string;
export declare function renderStepSummary(result: ScanResult): string;
