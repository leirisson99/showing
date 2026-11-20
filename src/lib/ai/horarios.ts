// Cálculo dos horários de visita livres (RN-17, RN-18, RN-22).
// America/Sao_Paulo está em UTC-3 o ano todo desde 2019 (sem horário de verão).

export type HorariosVisita = Partial<Record<DiaSemana, string[]>>;
export type DiaSemana = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

const DIAS: DiaSemana[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const DESLOCAMENTO_SP_MS = -3 * 60 * 60 * 1000;
const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

export const ANTECEDENCIA_MINIMA_H = 12;
export const JANELA_MAXIMA_DIAS = 14;

export type HorarioLivre = {
  /** Instante com fuso explícito, ex.: 2026-11-21T09:00:00-03:00 (é o que as ferramentas trocam). */
  iso: string;
  /** Texto para o comprador, ex.: "sábado, 21/11, às 09:00". */
  rotulo: string;
  instante: Date;
};

type Entrada = {
  horariosVisita: HorariosVisita;
  duracaoMin: number;
  /** Datas das visitas `pedida` ou `confirmada` do mesmo corretor. */
  ocupados: Date[];
  agora: Date;
};

const rotuloFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

function rotulo(instante: Date): string {
  const partes = Object.fromEntries(rotuloFmt.formatToParts(instante).map((p) => [p.type, p.value]));
  return `${partes.weekday}, ${partes.day}/${partes.month}, às ${partes.hour}:${partes.minute}`;
}

export function calcularHorariosLivres({ horariosVisita, duracaoMin, ocupados, agora }: Entrada): HorarioLivre[] {
  const minimo = agora.getTime() + ANTECEDENCIA_MINIMA_H * HORA_MS;
  const maximo = agora.getTime() + JANELA_MAXIMA_DIAS * DIA_MS;
  const duracaoMs = duracaoMin * 60 * 1000;

  // Meia-noite de hoje em São Paulo, como instante UTC.
  const hojeSP = new Date(agora.getTime() + DESLOCAMENTO_SP_MS);
  const meiaNoiteSP =
    Date.UTC(hojeSP.getUTCFullYear(), hojeSP.getUTCMonth(), hojeSP.getUTCDate()) - DESLOCAMENTO_SP_MS;

  const livres: HorarioLivre[] = [];
  for (let d = 0; d <= JANELA_MAXIMA_DIAS; d++) {
    const inicioDia = meiaNoiteSP + d * DIA_MS;
    const diaSP = new Date(inicioDia + DESLOCAMENTO_SP_MS);
    const horas = horariosVisita[DIAS[diaSP.getUTCDay()]] ?? [];

    for (const hhmm of horas) {
      const [h, m] = hhmm.split(":").map(Number);
      if (!Number.isInteger(h) || !Number.isInteger(m)) continue;
      const instante = new Date(inicioDia + h * HORA_MS + m * 60 * 1000);
      const t = instante.getTime();
      if (t < minimo || t > maximo) continue;
      if (ocupados.some((o) => Math.abs(o.getTime() - t) < duracaoMs)) continue;

      const ano = diaSP.getUTCFullYear();
      const mes = String(diaSP.getUTCMonth() + 1).padStart(2, "0");
      const dia = String(diaSP.getUTCDate()).padStart(2, "0");
      livres.push({
        iso: `${ano}-${mes}-${dia}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`,
        rotulo: rotulo(instante),
        instante,
      });
    }
  }
  return livres.sort((a, b) => a.instante.getTime() - b.instante.getTime());
}
