import { type ParsedDependencyFile, type ParseDependencyFileOptions } from "./common.js";
export declare function parseMsBuildProject(options: ParseDependencyFileOptions): ParsedDependencyFile;
export declare function parseDirectoryPackagesProps(options: ParseDependencyFileOptions): ParsedDependencyFile;
export declare function parsePackagesConfig(options: ParseDependencyFileOptions): ParsedDependencyFile;
export declare function parsePackagesLockJson(options: ParseDependencyFileOptions): ParsedDependencyFile;
