export function normalizeMavenPackageName(name: string): string | undefined {
  const trimmed = name.trim();
  const parts = trimmed.split(":");
  if (parts.length !== 2) {
    return undefined;
  }

  const [groupId, artifactId] = parts;
  if (
    groupId === undefined ||
    artifactId === undefined ||
    !isConcreteMavenCoordinatePart(groupId) ||
    !isConcreteMavenCoordinatePart(artifactId)
  ) {
    return undefined;
  }

  return `${groupId}:${artifactId}`;
}

export function mavenCoordinateParts(name: string): {
  groupId: string;
  artifactId: string;
} | undefined {
  const normalized = normalizeMavenPackageName(name);
  if (normalized === undefined) {
    return undefined;
  }

  const [groupId, artifactId] = normalized.split(":");
  return groupId === undefined || artifactId === undefined
    ? undefined
    : { groupId, artifactId };
}

export function isMavenCentralRepositoryUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.replace(/\/+$/u, "").toLowerCase();

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      ((hostname === "repo.maven.apache.org" && pathname === "/maven2") ||
        (hostname === "repo1.maven.org" && pathname === "/maven2"))
    );
  } catch {
    return false;
  }
}

export function isUnresolvedMavenValue(value: string | undefined): boolean {
  return value !== undefined && /\$\{[^}]+\}/u.test(value);
}

function isConcreteMavenCoordinatePart(value: string): boolean {
  return (
    value.length > 0 &&
    !isUnresolvedMavenValue(value) &&
    /^[A-Za-z0-9_.-]+$/u.test(value)
  );
}
