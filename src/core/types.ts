export type Ecosystem = "npm";

export type Severity = "low" | "medium" | "high";

export type RuleId = "package_not_found" | "package_too_new";

export type SourceKind = "manifest" | "lockfile" | "docs" | "shell";

export type ScanMode = "full" | "changed-only";

export type DependencyReference = {
  ecosystem: Ecosystem;
  name: string;
  versionRange?: string;
  sourceFile: string;
  sourceLine?: number;
  sourceKind: SourceKind;
  isDirect: boolean;
};

export type RegistryPackageFound = {
  status: "found";
  ecosystem: Ecosystem;
  name: string;
  firstPublishedAt?: Date;
  registryUrl?: string;
};

export type RegistryPackageNotFound = {
  status: "not_found";
  ecosystem: Ecosystem;
  name: string;
};

export type RegistryPackageFailure = {
  status:
    | "rate_limited"
    | "network_error"
    | "server_error"
    | "invalid_response"
    | "unsupported";
  ecosystem: Ecosystem;
  name: string;
  message: string;
  retryable: boolean;
};

export type RegistryResult =
  | RegistryPackageFound
  | RegistryPackageNotFound
  | RegistryPackageFailure;

export type RegistryClient = {
  getPackage(name: string): Promise<RegistryResult>;
};

export type Finding = {
  rule: RuleId;
  severity: Severity;
  ecosystem: Ecosystem;
  package: string;
  source: {
    file: string;
    line?: number;
  };
  evidence: string;
  recommendation: string;
};

export type ConfigWarning = {
  message: string;
  file?: string;
};

export type AllowRule = {
  ecosystem: Ecosystem;
  package: string;
  reason: string;
  expires?: Date;
};

export type IgnoreRule = {
  rule: RuleId;
  ecosystem: Ecosystem;
  package: string;
  reason: string;
  expires?: Date;
};

export type SlopLockConfig = {
  failOn: Exclude<Severity, "low">;
  ecosystems: readonly Ecosystem[];
  cooldown: {
    highDays: number;
    mediumDays: number;
  };
  allow: readonly AllowRule[];
  ignore: readonly IgnoreRule[];
};

export type ScanResult = {
  findings: Finding[];
  warnings: ConfigWarning[];
  registryFailures: RegistryPackageFailure[];
  scannedDependencies: number;
  failOn: Exclude<Severity, "low">;
};

export type ScanOptions = {
  rootDir: string;
  changedOnly?: boolean;
  baseRef?: string;
  configPath?: string;
  failOn?: Exclude<Severity, "low">;
  failClosed?: boolean;
  registryConcurrency?: number;
  registryClient?: RegistryClient;
  now?: Date;
  isCi?: boolean;
};
