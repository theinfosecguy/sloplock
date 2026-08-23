export type InitOutcome = {
    created: string[];
    skipped: string[];
    manifests: string[];
};
export declare function runInit(rootDir: string): Promise<InitOutcome>;
export declare function renderInitOutcome(outcome: InitOutcome): string;
