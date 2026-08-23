export class SlopLockError extends Error {
  readonly exitCode: number;
  readonly code: string;
  readonly hint: string | undefined;

  constructor(message: string, exitCode: number, code: string, hint?: string) {
    super(message);
    this.name = "SlopLockError";
    this.exitCode = exitCode;
    this.code = code;
    this.hint = hint;
  }
}

export class UsageError extends SlopLockError {
  constructor(message: string, options: { code?: string; hint?: string } = {}) {
    super(message, 2, options.code ?? "usage_error", options.hint);
    this.name = "UsageError";
  }
}

export class RegistryFailureError extends SlopLockError {
  constructor(message: string) {
    super(message, 3, "registry_failure");
    this.name = "RegistryFailureError";
  }
}
