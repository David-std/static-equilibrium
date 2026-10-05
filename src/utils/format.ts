export const formatDec = (value: number, decimals = 2): string =>
  value.toFixed(decimals).replace('.', ',');

export const formatGrams = (value: number): string =>
  Math.round(value) === value ? value.toString() : value.toFixed(1).replace('.', ',');
