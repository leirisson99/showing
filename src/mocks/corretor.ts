import type { HorariosVisita } from "@/lib/ai/horarios";
import { CORRETOR_MOCK } from "@/lib/mocks";

// Perfis dos corretores em memória (só desenvolvimento). No backend viram os campos do
// `User` (name, creci, whatsapp, fotoFileId, horariosVisita, duracaoVisitaMin).

export type PerfilCorretor = {
  id: string;
  email: string;
  nome: string | null;
  creci: string | null;
  whatsapp: string | null;
  fotoFileId: string | null;
  horariosVisita: HorariosVisita;
  duracaoVisitaMin: number;
};

function semear(): Map<string, PerfilCorretor> {
  return new Map([
    [
      CORRETOR_MOCK.id,
      {
        id: CORRETOR_MOCK.id,
        email: CORRETOR_MOCK.email,
        nome: "Corretor de Exemplo",
        creci: "CRECI-SC 00000",
        whatsapp: "5547999990000",
        fotoFileId: null,
        horariosVisita: { sab: ["09:00", "10:00", "11:00"], dom: ["10:00"] },
        duracaoVisitaMin: 60,
      },
    ],
  ]);
}

const g = globalThis as unknown as { __showingPerfis?: Map<string, PerfilCorretor> };

export function perfis(): Map<string, PerfilCorretor> {
  return (g.__showingPerfis ??= semear());
}

export function reiniciarPerfis() {
  g.__showingPerfis = semear();
}
