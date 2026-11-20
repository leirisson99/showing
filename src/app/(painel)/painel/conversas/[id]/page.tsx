import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, TriangleAlert } from "lucide-react";
import { BadgeVisita } from "@/components/painel/BadgeVisita";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { buscarConversaDoCorretor } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversa — Showing", robots: { index: false } };

export default async function ConversaPage({ params }: PageProps<"/painel/conversas/[id]">) {
  const { id } = await params;
  const corretor = await exigirCorretor();
  const dados = await buscarConversaDoCorretor(corretor.id, id);
  if (!dados) notFound();
  const { conversa, mensagens } = dados;
  const { lead } = conversa;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/painel/conversas" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para as conversas
      </Link>

      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">{lead?.nome ?? "Visitante sem contato"}</h1>
        <p className="text-muted-foreground">
          <Link href={`/painel/imoveis/${conversa.imovelId}`} className="underline-offset-4 hover:underline">
            {conversa.imovelTitulo}
          </Link>{" "}
          · começou em {formatarDataHora(conversa.criadaEm)}
        </p>
      </div>

      {conversa.transferida && (
        <p className="flex items-start gap-2 rounded-xl bg-[#FFF4E0] p-4 text-[#7A4A00]">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <strong>O atendente passou esta conversa para você.</strong> {conversa.motivoTransferencia}
          </span>
        </p>
      )}

      <section aria-labelledby="titulo-lead" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <h2 id="titulo-lead" className="text-lg font-semibold">Perfil do comprador</h2>
        {lead ? (
          <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Nome</dt><dd className="font-medium">{lead.nome}</dd></div>
            {lead.telefone && (
              <div>
                <dt className="text-sm text-muted-foreground">Telefone</dt>
                <dd><a href={`tel:+55${lead.telefone}`} className="inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline"><Phone className="size-4" aria-hidden />{formatarTelefone(lead.telefone)}</a></dd>
              </div>
            )}
            {lead.email && (
              <div>
                <dt className="text-sm text-muted-foreground">E-mail</dt>
                <dd><a href={`mailto:${lead.email}`} className="inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline"><Mail className="size-4" aria-hidden />{lead.email}</a></dd>
              </div>
            )}
            {lead.pagamento && <div><dt className="text-sm text-muted-foreground">Forma de pagamento</dt><dd className="font-medium">{lead.pagamento}</dd></div>}
            {lead.prazo && <div><dt className="text-sm text-muted-foreground">Prazo</dt><dd className="font-medium">{lead.prazo}</dd></div>}
            {conversa.consentimentoEm && (
              <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">Consentimento para guardar os dados</dt><dd className="font-medium">{formatarDataHora(conversa.consentimentoEm)}</dd></div>
            )}
          </dl>
        ) : (
          <p className="text-muted-foreground">O comprador não informou contato (ou não autorizou guardar os dados).</p>
        )}
        {conversa.visita && (
          <p className="flex flex-wrap items-center gap-2 border-t pt-3">
            Visita pedida para <strong>{formatarDataHora(conversa.visita.dataHora)}</strong>
            <BadgeVisita status={conversa.visita.status} />
            <Link href="/painel/visitas" className="text-sm underline underline-offset-4">Gerenciar visitas</Link>
          </p>
        )}
      </section>

      <section aria-labelledby="titulo-historico" className="flex flex-col gap-3">
        <h2 id="titulo-historico" className="text-lg font-semibold">Conversa</h2>
        <ol className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-4">
          {mensagens.map((m, i) => (
            <li key={i} className={cn("flex max-w-[85%] flex-col gap-0.5", m.de === "comprador" ? "self-end items-end" : "self-start")}>
              <span className="text-xs text-muted-foreground">{m.de === "comprador" ? "Comprador" : "Atendente"}</span>
              <p className={cn("rounded-2xl px-4 py-2 text-[15px] leading-snug whitespace-pre-line", m.de === "comprador" ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border")}>
                {m.texto}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
