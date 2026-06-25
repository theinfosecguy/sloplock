export declare function upsertStickyComment(input: {
    token: string;
    body: string;
}): Promise<"created" | "updated" | "skipped">;
