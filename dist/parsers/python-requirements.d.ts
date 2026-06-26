import { type ParsedDependencyFile, type ParseDependencyFileOptions } from "./common.js";
export declare function parsePythonRequirements(options: ParseDependencyFileOptions): ParsedDependencyFile;
export declare function parsePythonRequirementString(input: {
    requirement: string;
    sourceFile: string;
    sourceLine?: number;
}): ParsedDependencyFile;
