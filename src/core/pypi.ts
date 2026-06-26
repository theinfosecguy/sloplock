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

export function isPublicPypiRegistryUrl(specifier: string): boolean {
  try {
    const url = new URL(specifier);
    return url.hostname === "pypi.org" && url.pathname.replace(/\/+$/u, "") === "/simple";
  } catch {
    return false;
  }
}
