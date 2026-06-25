export class SlopLockError extends Error {
    exitCode;
    constructor(message, exitCode) {
        super(message);
        this.name = "SlopLockError";
        this.exitCode = exitCode;
    }
}
export class UsageError extends SlopLockError {
    constructor(message) {
        super(message, 2);
        this.name = "UsageError";
    }
}
export class RegistryFailureError extends SlopLockError {
    constructor(message) {
        super(message, 3);
        this.name = "RegistryFailureError";
    }
}
//# sourceMappingURL=errors.js.map