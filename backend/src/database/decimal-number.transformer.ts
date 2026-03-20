import { ValueTransformer } from 'typeorm';

function parseDecimalValue(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid decimal value: ${String(value)}`);
  }

  return parsed;
}

export const decimalNumberTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => {
    if (value === undefined) {
      return undefined;
    }
    return parseDecimalValue(value);
  },
  from: (value: number | string | null | undefined) => parseDecimalValue(value),
};
