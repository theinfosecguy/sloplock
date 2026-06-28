import type { ConfigWarning, ScanResult } from "../core/types.js";
import type { ActionInputs } from "./inputs.js";
export type CommentStatus = "created" | "updated" | "skipped" | "disabled" | "failed";
export declare function buildSetupWarnings(input: {
    inputs: ActionInputs;
    baseRef?: string;
    hasPullRequest: boolean;
    dependencyFileCount: number;
    isShallowRepository: boolean;
    result: ScanResult;
}): ConfigWarning[];
export declare function buildCommentWarnings(input: {
    inputs: ActionInputs;
    status: CommentStatus;
}): ConfigWarning[];
export declare function withWarnings(result: ScanResult, warnings: readonly ConfigWarning[]): ScanResult;
