import "dotenv/config";
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { iaConfigurada } from "@/lib/ai/modelo";
import { gerarRoteiroComIA } from "./agente";
import type { EntradaRoteiro } from "./entrada";
import { validarRoteiro } from "./validador";

// Diretor da Página contra o MODELO REAL (docs/agent-diretor-pagina.md, critérios de aceite). Só roda com
// AI_API_KEY e AI_MODEL; chama a API e custa tokens. Dados fictícios.

const COM_IA = iaConfigurada();
const TEMPO = 240_000;

const fotos = (n: number, legendas: (string | null)[] = []) => Array.from({ length: n }, (_, k) => ({ id: `foto-${k + 1}`, ordem: k, legenda: legendas[k] ?? null }));

const apartamento: EntradaRoteiro = {
  imovel: {
    tipo: "apartamento", finalidade: "venda", bairro: "Victor Konder", cidade: "Blumenau", endereco: "Rua Exemplo, 123", mostrarEndereco: false, preco: 480000, condominio: 520, iptu: 90,
    quartos: 2, suites: 1, banheiros: 1, vagas: 1, areaM2: 68, aceitaFinanciamento: true, aceitaFgts: true, caracteristicas: ["Sacada com churrasqueira", "Armários embutidos", "Elevador"], infoAdicional: null,
    infoBairro: { escolas: ["Escola de exemplo A"], mercados: ["Mercado de exemplo"], saude: ["Posto de saúde de exemplo"], distanciaCentro: "10 minutos de carro" },
  },
  fotos: fotos(6, ["Fachada do prédio", "Sala de estar", "Cozinha", "Quarto principal", "Sacada com churrasqueira", "Banheiro"]),
};

const casa: EntradaRoteiro = {
  imovel: {
    tipo: "casa", finalidade: "venda", bairro: "Itoupava Norte", cidade: "Blumenau", endereco: "Rua Dr. Pedro Zimmermann, 1234", mostrarEndereco: false, preco: 780000, condominio: null, iptu: 1800,
    quartos: 3, suites: 1, banheiros: 2, vagas: 2, areaM2: 180, aceitaFinanciamento: true, aceitaFgts: false, caracteristicas: ["Quintal com churrasqueira", "Sala integrada à cozinha"], infoAdicional: "Rua sem saída.",
    infoBairro: null,
  },
  fotos: fotos(9, ["Fachada", "Sala integrada", "Cozinha", "Quarto", "Suíte", "Quintal", null, null, "Garagem"]),
};

const textos = (r: NonNullable<Awaited<ReturnType<typeof gerarRoteiroComIA>> & { ok: true }>["roteiro"]) =>
  r.capitulos.flatMap((c) => (c.tipo === "ambientes_fixo" ? c.quadros.map((q) => q.frase.texto) : "titulo" in c ? [c.titulo.texto] : []));

describe.skipIf(!COM_IA)("Diretor da Página (modelo real)", () => {
  for (const [nome, entrada, esperado] of [["apartamento com 6 fotos", apartamento, "essencial"], ["casa com 9 fotos", casa, "familia"]] as const) {
    it(`${nome}: gera um roteiro válido em até 3 tentativas, com o template certo`, { timeout: TEMPO }, async () => {
      const inicio = Date.now();
      const r = await gerarRoteiroComIA(entrada);
      const segundos = Math.round((Date.now() - inicio) / 1000);
      writeFileSync(`/tmp/diretor-${esperado}.json`, JSON.stringify({ segundos, resultado: r.ok ? { tentativas: r.tentativas, template: r.roteiro.template, motivo: r.roteiro.motivoTemplate, persona: r.roteiro.persona, seo: r.roteiro.seo, capitulos: r.roteiro.capitulos.map((c) => c.tipo), textos: textos(r.roteiro), alertas: r.roteiro.alertas } : r }, null, 1));
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.roteiro.template).toBe(esperado);
      // O que o agente salvou passa de novo pelo validador, já com os ids reais.
      expect(validarRoteiro(r.roteiro, entrada).ok).toBe(true);
    });
  }
});
