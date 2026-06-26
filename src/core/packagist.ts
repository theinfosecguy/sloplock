const packagistPackageNamePattern =
  /^[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?$/iu;

const platformPackageNames = new Set([
  "composer",
  "composer-plugin-api",
  "composer-runtime-api",
  "hhvm",
  "php"
]);

export function normalizePackagistPackageName(name: string): string | undefined {
  const normalized = name.trim().toLowerCase();

  if (
    normalized.length === 0 ||
    normalized.length > 214 ||
    !packagistPackageNamePattern.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

export function isComposerPlatformPackageName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    platformPackageNames.has(normalized) ||
    normalized.startsWith("ext-") ||
    normalized.startsWith("lib-") ||
    normalized.startsWith("php-")
  );
}

export function isPublicPackagistRepositoryUrl(specifier: string): boolean {
  try {
    const url = new URL(specifier);
    return (
      url.hostname === "repo.packagist.org" ||
      (url.hostname === "packagist.org" &&
        (url.pathname === "" || url.pathname === "/" || url.pathname === "/packages.json"))
    );
  } catch {
    return false;
  }
}

export function isPublicPackagistNotificationUrl(specifier: string): boolean {
  try {
    const url = new URL(specifier);
    return url.hostname === "packagist.org" && url.pathname.startsWith("/downloads");
  } catch {
    return false;
  }
}
