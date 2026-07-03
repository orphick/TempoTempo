const numberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value, fallback = "نامشخص") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;

  const formatter = Number.isInteger(numeric) ? integerFormatter : numberFormatter;
  return `${formatter.format(numeric)} دلار`;
}

export function formatNumber(value, fallback = "—") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return integerFormatter.format(numeric);
}
