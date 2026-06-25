const severityRank = {
    low: 0,
    medium: 1,
    high: 2
};
export function isAtOrAboveSeverity(severity, threshold) {
    return severityRank[severity] >= severityRank[threshold];
}
export function highestSeverity(severities) {
    return severities.reduce((highest, severity) => {
        if (highest === undefined) {
            return severity;
        }
        return severityRank[severity] > severityRank[highest] ? severity : highest;
    }, undefined);
}
//# sourceMappingURL=severity.js.map