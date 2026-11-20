import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, TriangleAlert } from "lucide-react";
import { MarcarComoLida } from "@/components/painel/AcaoDeConversa";
import { BadgeVisita } from "@/components/painel/BadgeVisita";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { ExcluirDadosComprador } from "@/components/painel/ExcluirDadosComprador";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { buscarConversaDoCorretor } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversa — Showing", robots: { index: false } };

const link = "inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline";

export default async function ConversaPage({ params }: PageProps<"/painel/conversas/[id]">) {
  const { id } = await params;
  const corretor = await exigirCorretor();
  const dados = await buscarConversaDoCorretor(corretor.id, id);
  if (!dados) notFound();
  const { conversa, mensagens } = dados;
  const { lead } = conversa;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/painel/conversas" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para as conversas
      </Link>

      <CabecalhoPagina
        rotulo="Conversa"
        titulo={lead?.nome ?? "Visitante sem contato"}
        descricao={
          <>
            <Link href={`/painel/imoveis/${conversa.imovelId}`} className="underline-offset-4 hover:underline">
              {conversa.imovelTitulo}
            </Link>{" "}
            · começou em {formatarDataHora(conversa.criadaEm)}
          </>
        }
      />

      {conversa.transferida && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-aviso-bg p-5 text-aviso">
          <p className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              <strong>O atendente passou esta conversa para você.</strong> {conversa.motivoTransferencia}
            </span>
          </p>
          {conversa.naoLida && <MarcarComoLida conversaId={conversa.id} />}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="titulo-historico" className="flex flex-col gap-3">
          <h2 id="titulo-historico" className="text-xl font-medium">Histórico</h2>
          <ol className="flex flex-col gap-3 rounded-3xl bg-muted/50 p-5">
            {mensagens.map((m, i) => (
              <li key={i} className={cn("flex max-w-[85%] flex-col gap-0.5", m.de === "comprador" ? "items-end self-end" : "self-start")}>
                <span className="text-xs text-muted-foreground">{m.de === "comprador" ? "Comprador" : "Atendente"}</span>
                <p
                  className={cn(
                    "rounded-2xl px-4 py-2 text-[15px] leading-snug whitespace-pre-line",
                    m.de === "comprador" ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-foreground/10",
                  )}
                >
                  {m.texto}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="Perfil do comprador" className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <section aria-labelledby="titulo-lead" className="flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 id="titulo-lead" className="text-xl font-medium">Perfil do comprador</h2>
            {lead ? (
              <dl className="flex flex-col gap-3 text-[15px]">
                <div><dt className="text-sm text-muted-foreground">Nome</dt><dd className="font-medium">{lead.nome}</dd></div>
                {lead.telefone && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Telefone</dt>
                    <dd><a href={`tel:+55${lead.telefone}`} className={link}><Phone className="size-4" aria-hidden />{formatarTelefone(lead.telefone)}</a></dd>
                  </div>
                )}
                {lead.email && (
                  <div>
                    <dt className="text-sm text-muted-foreground">E-mail</dt>
                    <dd><a href={`mailto:${lead.email}`} className={`${link} break-all`}><Mail className="size-4 shrink-0" aria-hidden />{lead.email}</a></dd>
                  </div>
                )}
                {lead.pagamento && <div><dt className="text-sm text-muted-foreground">Forma de pagamento</dt><dd className="font-medium">{lead.pagamento}</dd></div>}
                {lead.prazo && <div><dt className="text-sm text-muted-foreground">Prazo</dt><dd className="font-medium">{lead.prazo}</dd></div>}
                {conversa.consentimentoEm && (
                  <div><dt className="text-sm text-muted-foreground">Autorizou guardar os dados em</dt><dd className="font-medium">{formatarDataHora(conversa.consentimentoEm)}</dd></div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground">
                {conversa.anonimizadaEm
                  ? `Dados pessoais removidos em ${formatarDataHora(conversa.anonimizadaEm)}.`
                  : "O comprador não informou contato (ou não autorizou guardar os dados)."}
              </p>
            )}
            {!conversa.anonimizadaEm && <ExcluirDadosComprador tipo="conversa" id={conversa.id} />}
          </section>

          {conversa.visita && (
            <section aria-labelledby="titulo-visita" className="flex flex-col gap-2 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
              <h2 id="titulo-visita" className="text-xl font-medium">Visita</h2>
              <p className="flex flex-wrap items-center gap-2">
                <strong>{formatarDataHora(conversa.visita.dataHora)}</strong>
                <BadgeVisita status={conversa.visita.status} />
              </p>
              <Link href="/painel/visitas" className="inline-flex min-h-11 w-fit items-center text-sm underline underline-offset-4">
                Gerenciar visitas
              </Link>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
