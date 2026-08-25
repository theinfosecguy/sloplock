export class SlopLockError extends Error {
    exitCode;
    code;
    hint;
    constructor(message, exitCode, code, hint) {
        super(message);
        this.name = "SlopLockError";
        this.exitCode = exitCode;
        this.code = code;
        this.hint = hint;
    }
}
export class UsageError extends SlopLockError {
    constructor(message, options = {}) {
        super(message, 2, options.code ?? "usage_error", options.hint);
        this.name = "UsageError";
    }
}
export class RegistryFailureError extends SlopLockError {
    constructor(message) {
        super(message, 3, "registry_failure");
        this.name = "RegistryFailureError";
    }
}
//# sourceMappingURL=errors.js.map