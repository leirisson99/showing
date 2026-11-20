import { createElement } from "react";
import { ConversaTransferida } from "@/emails/conversa-transferida";
import { PedidoRecebido } from "@/emails/pedido-recebido";
import { VisitaAtualizada } from "@/emails/visita-atualizada";
import { VisitaPedida } from "@/emails/visita-pedida";
import { db } from "@/lib/db";
import { emailConfigurado, enviarEmail } from "@/lib/email";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { usarMocks } from "@/lib/mocks";
import { urlDoImovel, urlDoSite } from "@/lib/seo";

// Notificações por e-mail (BK-07). Best-effort: a visita e a conversa já estão salvas quando
// estas funções rodam, e uma falha de envio nunca desfaz nem quebra a operação principal.
// Nunca registre endereço, nome ou texto de mensagem em log (LGPD): só o tipo do erro.

/** Ligado só com e-mail configurado e fora do modo de exemplo. */
export function notificacoesAtivas(): boolean {
  return emailConfigurado() && !usarMocks();
}

/** Roda sem `await` e sem deixar a falha escapar. */
export function disparar(tarefa: () => Promise<void>) {
  void Promise.resolve()
    .then(tarefa)
    .catch((e) => console.error("e-mail: falha ao enviar", { tipo: e instanceof Error ? e.name : "desconhecido" }));
}

type Lead = { nome?: string; telefone?: string; email?: string } | null;
const leadDe = (v: unknown, consentimento: boolean): Lead => (consentimento ? ((v as Lead) ?? null) : null);

/** Visita pedida: avisa o corretor e confirma o pedido ao comprador (se deixou e-mail). */
export async function avisarVisitaPedida(visitaId: string) {
  const v = await db.visita.findUnique({
    where: { id: visitaId },
    include: { imovel: { select: { titulo: true, slug: true, corretor: { select: { email: true, name: true } } } }, conversa: { select: { perfilLead: true, consentimento: true } } },
  });
  if (!v) return;
  const lead = leadDe(v.conversa.perfilLead, v.conversa.consentimento);
  const quando = formatarDataHora(v.dataHora);
  const contato = [lead?.telefone && formatarTelefone(lead.telefone), lead?.email].filter(Boolean).join(" · ") || "não informado";

  await enviarEmail({
    para: v.imovel.corretor.email,
    assunto: `Novo pedido de visita: ${v.imovel.titulo}`,
    template: createElement(VisitaPedida, { imovel: v.imovel.titulo, dataHora: quando, comprador: lead?.nome ?? "Comprador", contato, link: `${urlDoSite()}/painel/visitas` }),
  });
  if (lead?.email) {
    await enviarEmail({
      para: lead.email,
      assunto: "Recebemos o seu pedido de visita",
      template: createElement(PedidoRecebido, { nome: lead.nome ?? "tudo bem", imovel: v.imovel.titulo, dataHora: quando, corretor: v.imovel.corretor.name ?? "O corretor", link: urlDoImovel(v.imovel.slug) }),
    });
  }
}

/** Conversa transferida: avisa o corretor com o motivo. */
export async function avisarTransferencia(conversaId: string, motivo: string) {
  const c = await db.conversa.findUnique({ where: { id: conversaId }, select: { imovel: { select: { titulo: true, corretor: { select: { email: true } } } } } });
  if (!c) return;
  await enviarEmail({
    para: c.imovel.corretor.email,
    assunto: `Conversa para você: ${c.imovel.titulo}`,
    template: createElement(ConversaTransferida, { imovel: c.imovel.titulo, motivo, link: `${urlDoSite()}/painel/conversas/${conversaId}` }),
  });
}

/** Corretor confirmou ou cancelou: avisa o comprador, se deixou e-mail. */
export async function avisarStatusDaVisita(visitaId: string, situacao: "confirmada" | "cancelada") {
  const v = await db.visita.findUnique({
    where: { id: visitaId },
    include: { imovel: { select: { titulo: true, slug: true, corretor: { select: { name: true } } } }, conversa: { select: { perfilLead: true, consentimento: true } } },
  });
  const lead = v && leadDe(v.conversa.perfilLead, v.conversa.consentimento);
  if (!v || !lead?.email) return;
  await enviarEmail({
    para: lead.email,
    assunto: situacao === "confirmada" ? "Sua visita foi confirmada" : "Sua visita foi cancelada",
    template: createElement(VisitaAtualizada, {
      nome: lead.nome ?? "tudo bem",
      imovel: v.imovel.titulo,
      dataHora: formatarDataHora(v.dataHora),
      corretor: v.imovel.corretor.name ?? "O corretor",
      situacao,
      link: urlDoImovel(v.imovel.slug),
    }),
  });
}
