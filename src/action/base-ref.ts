export function resolveChangedOnlyBaseRef(input: {
  inputBase?: string;
  pullRequest?: unknown;
}): string | undefined {
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

function readRecordProperty(input: unknown, key: string): Record<string, unknown> | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return undefined;
  }

  const value = (input as Record<string, unknown>)[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function readStringProperty(input: unknown, key: string): string | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return undefined;
  }

  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}
