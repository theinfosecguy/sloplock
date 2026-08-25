export declare class SlopLockError extends Error {
    readonly exitCode: number;
    readonly code: string;
    readonly hint: string | undefined;
    constructor(message: string, exitCode: number, code: string, hint?: string);
}
export declare class UsageError extends SlopLockError {
    constructor(message: string, options?: {
        code?: string;
        hint?: string;
    });
}
export declare class RegistryFailureError extends SlopLockError {
    constructor(message: string);
}
