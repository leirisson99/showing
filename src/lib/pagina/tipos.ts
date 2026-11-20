import type { Roteiro } from "./roteiro";

export type RelatorioRoteiro = {
  /** "ia": o Diretor escreveu; "padrao": montado só por código (IA desligada ou fora do ar). */
  origem: "ia" | "padrao";
  camposUsados: string[];
  alertas: string[];
  instrucao?: string;
  /** O corretor mexeu no texto: gerar de novo pede confirmação. */
  editado?: boolean;
  tentativas?: number;
};

export type VersaoDoRoteiro = {
  id: string;
  imovelId: string;
  versao: number;
  conteudo: Roteiro;
  relatorio: RelatorioRoteiro;
  aprovado: boolean;
  atualizadoEm: Date;
};
