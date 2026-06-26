# Security Policy

## Supported Versions

SlopLock has not published a stable public release yet. Until the first V1 release, security fixes apply to the `main` branch only.

After V1, supported versions will be documented here by release line.

## Scope

Please report security issues in SlopLock itself, including:

- Incorrectly treating unavailable or malformed registry responses as package existence results.
- False negatives that allow clearly nonexistent npm, PyPI, or crates.io packages through supported V1 inputs.
- Command injection, path traversal, or unsafe handling of untrusted package names, file paths, branch names, PR metadata, manifests, lockfiles, or config files.
- GitHub Action behavior that exposes secrets, requires unsafe permissions, or mishandles pull request input.
- npm package, action, or release workflow issues that could publish stale, tampered, or unexpected artifacts.

V1 intentionally supports npm, PyPI, and crates.io package manifests and lockfiles only. Missing support for other ecosystems, package reputation scoring, typosquat detection, vulnerability scanning, install-script analysis, or private registry policy is not considered a vulnerability unless documented behavior says otherwise.

## Reporting

Do not open a public issue for suspected vulnerabilities.

Preferred reporting path:

1. Use GitHub private vulnerability reporting for this repository, if available.
2. If that is not available, contact the repository owner privately at the public email listed on the owner profile: `kemalik+1@linkedin.com`.

Include as much detail as practical:

- Affected command or GitHub Action configuration.
- Minimal fixture files needed to reproduce the issue.
- Expected result and actual result.
- Whether the issue requires network failure, registry behavior, malicious package names, malicious file paths, or pull request metadata.
- Any logs or output, with secrets removed.

## Response Expectations

For a valid security report, the maintainer should aim to:

- Acknowledge receipt within 5 business days.
- Confirm impact and affected versions before public disclosure.
- Prioritize fixes for high-confidence bypasses, unsafe command execution, token exposure, and release integrity issues.
- Credit reporters on request, unless they prefer to remain anonymous.

## Disclosure

Please avoid public disclosure until a fix is available or the maintainer has had a reasonable time to respond. If the issue affects users after a public release, the fix should include release notes that describe impact, affected versions, and remediation steps without exposing unnecessary exploit detail.
