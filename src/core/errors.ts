export class SlopLockError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = "SlopLockError";
    this.exitCode = exitCode;
  }
}

export class UsageError extends SlopLockError {
  constructor(message: string) {
    super(message, 2);
    this.name = "UsageError";
  }
}

export class RegistryFailureError extends SlopLockError {
  constructor(message: string) {
    super(message, 3);
    this.name = "RegistryFailureError";
  }
}
