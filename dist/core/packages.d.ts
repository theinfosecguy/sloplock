import type { Ecosystem } from "./types.js";
export declare function normalizePackageName(ecosystem: Ecosystem, packageName: string): string | undefined;
export declare function stripVersionSpec(ecosystem: Ecosystem, spec: string): string;
export declare function registryDisplayName(ecosystem: Ecosystem): string;
