const cratesPackageNamePattern = /^[a-z0-9][a-z0-9_-]*$/iu;
export function normalizeCratesPackageName(name) {
    const trimmed = name.trim();
    if (trimmed.length === 0 ||
        trimmed.length > 64 ||
        !cratesPackageNamePattern.test(trimmed)) {
        return undefined;
    }
    return trimmed.toLowerCase();
}
export function isDefaultCratesRegistrySource(source) {
    const trimmed = source.trim();
    return (trimmed === "registry+https://github.com/rust-lang/crates.io-index" ||
        trimmed === "registry+https://index.crates.io/");
}
//# sourceMappingURL=crates.js.map