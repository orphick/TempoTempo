const integerFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value, fallback = "\u0646\u0627\u0645\u0634\u062e\u0635") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;

  return `${integerFormatter.format(Math.round(numeric))} \u062a\u0648\u0645\u0627\u0646`;
}

export function formatNumber(value, fallback = "—") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return integerFormatter.format(numeric);
}
