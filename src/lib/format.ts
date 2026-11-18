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
