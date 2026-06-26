const pypiPackageNamePattern = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/iu;

export function normalizePypiPackageName(name: string): string | undefined {
  const trimmed = name.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > 214 ||
    !pypiPackageNamePattern.test(trimmed)
  ) {
    return undefined;
  }

  return trimmed.toLowerCase().replace(/[-_.]+/gu, "-");
}
