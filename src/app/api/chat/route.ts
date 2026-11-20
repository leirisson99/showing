import { NextResponse } from "next/server";
import type { MessageData } from "@strands-agents/sdk";
import { z } from "zod";
import { criarAtendente } from "@/lib/ai/atendente";
import type { Resultado } from "@/lib/ai/atendimento";
import { LIMITE_MENSAGENS_COMPRADOR, LIMITE_POR_MINUTO } from "@/lib/ai/limites";
import { iaConfigurada } from "@/lib/ai/modelo";
import { obterRepositorio } from "@/lib/ai/repositorio-atual";
import { buscarImovelPublicoPorId } from "@/lib/imoveis";
import { dentroDoLimite } from "@/lib/rate-limit";

// Atendente de IA com streaming (card C3). Um agente novo por requisição, com o histórico
// carregado do banco. Resposta em NDJSON: uma linha JSON por evento
//   {"tipo":"inicio","conversaId"} · {"tipo":"texto","texto"} ·
//   {"tipo":"fim","sugestoes"?,"pedeConsentimento"?,"encerrada"?} · {"tipo":"erro","texto"}
// Logs: só o id da conversa e o tipo do erro, nunca o texto nem dados do comprador (LGPD).

const UM_MINUTO = 60_000;

const corpo = z.object({
  imovelId: z.string().min(1).max(100),
  conversaId: z.uuid().optional(),
  mensagem: z.string().trim().min(1, "Escreva uma mensagem.").max(500, "Mensagem muito longa."),
});

const PEDE_CONSENTIMENTO = /autoriz|consentiment|posso (guardar|registrar|anotar|passar)/i;

const erro = (codigo: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ erro: codigo, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "desconhecido";
}

/** Mensagens do comprador: turnos de usuário que têm texto (resultados de ferramenta não contam). */
function contarMensagensDoComprador(mensagens: MessageData[]): number {
  return mensagens.filter((m) => m.role === "user" && m.content.some((c) => "text" in c)).length;
}

export async function POST(request: Request) {
  const entrada = corpo.safeParse(await request.json().catch(() => null));
  if (!entrada.success) return erro("pedido_invalido", 400, { detalhe: entrada.error.issues[0]?.message });
  const { imovelId, mensagem } = entrada.data;

  if (!iaConfigurada()) return erro("ia_indisponivel", 503);

  if (!dentroDoLimite(`ip:${ipDe(request)}`, LIMITE_POR_MINUTO, UM_MINUTO)) return erro("muitas_mensagens", 429);
  if (entrada.data.conversaId && !dentroDoLimite(`conversa:${entrada.data.conversaId}`, LIMITE_POR_MINUTO, UM_MINUTO)) {
    return erro("muitas_mensagens", 429);
  }

  // RN-01 e RN-04: só imóvel publicado; vendido não tem atendente.
  const imovel = await buscarImovelPublicoPorId(imovelId);
  if (!imovel || imovel.status !== "publicado") return erro("imovel_indisponivel", 404);

  const repo = obterRepositorio();
  let conversaId = entrada.data.conversaId;
  if (conversaId) {
    const existente = await repo.buscarConversa(conversaId);
    if (!existente || existente.imovelId !== imovel.id) return erro("conversa_nao_encontrada", 404);
  } else {
    conversaId = await repo.criarConversa(imovel.id);
  }
  const idDaConversa = conversaId;

  const historico = await repo.mensagensDaConversa(idDaConversa);
  const codificador = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let aberto = true;
      const enviar = (evento: Record<string, unknown>) => {
        if (aberto) controller.enqueue(codificador.encode(`${JSON.stringify(evento)}\n`));
      };
      request.signal.addEventListener("abort", () => (aberto = false));

      enviar({ tipo: "inicio", conversaId: idDaConversa });

      // RN-16: ao atingir o limite, oferece o contato do corretor e encerra.
      if (contarMensagensDoComprador(historico) >= LIMITE_MENSAGENS_COMPRADOR) {
        enviar({
          tipo: "texto",
          texto: `Chegamos ao limite de mensagens desta conversa. Para continuar, fale direto com ${imovel.corretor.nome} pelos contatos da página.`,
        });
        enviar({ tipo: "fim", encerrada: true });
        controller.close();
        return;
      }

      let sugestoes: string[] | undefined;
      let texto = "";

      try {
        const agente = criarAtendente({
          imovel,
          historico,
          ctx: {
            imovelId: imovel.id,
            conversaId: idDaConversa,
            repo,
            observador: ({ ferramenta, resultado }: { ferramenta: string; resultado: Resultado }) => {
              if (!resultado.ok) return;
              if (ferramenta === "listar_horarios") {
                const horarios = (resultado.horarios as { rotulo: string }[] | undefined) ?? [];
                sugestoes = horarios.map((h) => h.rotulo);
              }
              if (ferramenta === "agendar_visita") sugestoes = undefined;
            },
          },
        });

        for await (const ev of agente.stream(mensagem)) {
          if (
            ev.type === "modelStreamUpdateEvent" &&
            ev.event.type === "modelContentBlockDeltaEvent" &&
            ev.event.delta.type === "textDelta"
          ) {
            texto += ev.event.delta.text;
            enviar({ tipo: "texto", texto: ev.event.delta.text });
          }
        }

        await repo.salvarMensagens(idDaConversa, agente.messages.map((m) => m.toJSON()));

        // Botões de consentimento: só enquanto os dados ainda não foram autorizados.
        const conversa = await repo.buscarConversa(idDaConversa);
        const pedeConsentimento = !conversa?.consentimento && PEDE_CONSENTIMENTO.test(texto);
        enviar({
          tipo: "fim",
          ...(pedeConsentimento ? { pedeConsentimento: true, sugestoes: ["Autorizo", "Não autorizo"] } : sugestoes ? { sugestoes } : {}),
        });
      } catch (e) {
        console.error("chat: falha ao responder", { conversaId: idDaConversa, tipo: e instanceof Error ? e.name : "desconhecido" });
        enviar({ tipo: "erro", texto: "Não consegui responder agora. Tente de novo em instantes ou fale direto com o corretor." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
