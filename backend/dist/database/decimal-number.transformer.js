"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decimalNumberTransformer = void 0;
function parseDecimalValue(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid decimal value: ${String(value)}`);
    }
    return parsed;
}
exports.decimalNumberTransformer = {
    to: (value) => {
        if (value === undefined) {
            return undefined;
        }
        return parseDecimalValue(value);
    },
    from: (value) => parseDecimalValue(value),
};
//# sourceMappingURL=decimal-number.transformer.js.map