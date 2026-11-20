const LOCALE = "pt-BR";
const TIMEZONE = "America/Sao_Paulo";

export function formatarPreco(valor: number | string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(valor));
}

export function formatarData(data: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "long",
    timeZone: TIMEZONE,
  }).format(new Date(data));
}

export function formatarDataHora(data: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TIMEZONE,
  }).format(new Date(data));
}

export function formatarArea(m2: number | string): string {
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(Number(m2))} m²`;
}

/** Telefone brasileiro a partir dos dígitos: (47) 99999-0001. Outros formatos voltam como vieram. */
export function formatarTelefone(telefone: string): string {
  const d = telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}
