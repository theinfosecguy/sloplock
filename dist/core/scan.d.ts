import type { CheckPackagesOptions, CheckPackagesResult, ScanOptions, ScanResult } from "./types.js";
export declare function scan(options: ScanOptions): Promise<ScanResult>;
export declare function checkPackages(options: CheckPackagesOptions): Promise<CheckPackagesResult>;
