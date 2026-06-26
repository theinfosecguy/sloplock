export declare function normalizeMavenPackageName(name: string): string | undefined;
export declare function mavenCoordinateParts(name: string): {
    groupId: string;
    artifactId: string;
} | undefined;
export declare function isMavenCentralRepositoryUrl(input: string): boolean;
export declare function isUnresolvedMavenValue(value: string | undefined): boolean;
