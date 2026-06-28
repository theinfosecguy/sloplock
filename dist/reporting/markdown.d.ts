import type { ConfigWarning, ScanResult } from "../core/types.js";
export declare const stickyCommentMarker = "<!-- sloplock-comment -->";
export declare function renderMarkdown(result: ScanResult): string;
export declare function renderPullRequestComment(result: ScanResult): string;
export declare function renderStepSummary(result: ScanResult): string;
export declare function renderActionFailureComment(input: {
    title: string;
    message: string;
    warnings?: readonly ConfigWarning[];
}): string;
export declare function renderActionFailureSummary(input: {
    title: string;
    message: string;
    warnings?: readonly ConfigWarning[];
}): string;
