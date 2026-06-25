export declare class SlopLockError extends Error {
    readonly exitCode: number;
    constructor(message: string, exitCode: number);
}
export declare class UsageError extends SlopLockError {
    constructor(message: string);
}
export declare class RegistryFailureError extends SlopLockError {
    constructor(message: string);
}
