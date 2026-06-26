const rubygemsPackageNamePattern = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?$/u;

const publicRubyGemsHosts = new Set(["rubygems.org", "index.rubygems.org"]);

export function normalizeRubygemsPackageName(name: string): string | undefined {
  const trimmed = name.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > 255 ||
    !rubygemsPackageNamePattern.test(trimmed)
  ) {
    return undefined;
  }

  return trimmed;
}

export function isPublicRubyGemsSourceUrl(specifier: string): boolean {
  try {
    const url = new URL(specifier);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      publicRubyGemsHosts.has(url.hostname.toLowerCase()) &&
      url.pathname.replace(/\/+$/u, "") === ""
    );
  } catch {
    return false;
  }
}
