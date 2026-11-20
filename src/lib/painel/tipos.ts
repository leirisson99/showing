import type { ImovelPublico } from "@/lib/imoveis";

export type StatusImovel = "rascunho" | "publicado" | "vendido";

export type FotoPainel = {
  id: string;
  fileId: string;
  legenda: string | null;
  ordem: number;
};

// O que o corretor cadastra. É a visão completa; a página pública usa ImovelPublico.
export type ImovelPainel = Omit<ImovelPublico, "status" | "fotos" | "corretor"> & {
  status: StatusImovel;
  corretorId: string;
  fotos: FotoPainel[];
  publicadoEm: string | null;
};
