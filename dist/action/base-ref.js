export function resolveChangedOnlyBaseRef(input) {
    if (input.inputBase !== undefined) {
        const trimmed = input.inputBase.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    const base = readRecordProperty(input.pullRequest, "base");
    const sha = readStringProperty(base, "sha");
    if (sha !== undefined && sha.trim().length > 0) {
        return sha.trim();
    }
    const ref = readStringProperty(base, "ref");
    if (ref !== undefined && ref.trim().length > 0) {
        return `origin/${ref.trim()}`;
    }
    return undefined;
}
function readRecordProperty(input, key) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return undefined;
    }
    const value = input[key];
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? value
        : undefined;
}
function readStringProperty(input, key) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return undefined;
    }
    const value = input[key];
    return typeof value === "string" ? value : undefined;
}
//# sourceMappingURL=base-ref.js.map