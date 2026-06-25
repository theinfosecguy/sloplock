export declare function normalizeNpmPackageName(name: string): string | undefined;
export declare function packageNameFromNpmAlias(versionRange: string): string | undefined;
export declare function isRegistryVersionRange(versionRange: string): boolean;
export declare function isRegistryLockfileSpecifier(specifier: string): boolean;
export declare function hasNonRegistryProtocol(specifier: string): boolean;
export declare function isPublicNpmRegistryUrl(specifier: string): boolean;
