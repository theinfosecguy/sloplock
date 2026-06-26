export declare function normalizeGoModulePath(input: string): string | undefined;
export declare function escapeGoProxyPath(input: string): string;
export declare function goPrivatePatternsFromEnvironment(env?: NodeJS.ProcessEnv): string[];
export declare function splitGoPrivatePatternList(input: string | undefined): string[];
export declare function matchesGoPrivateModulePattern(modulePath: string, pattern: string): boolean;
