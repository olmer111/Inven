const fmtCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un precio en pesos colombianos; null/undefined → "Sin precio". */
export function formatearCOP(valor: number | null | undefined): string {
  return valor == null ? "Sin precio" : fmtCOP.format(valor);
}
