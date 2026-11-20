import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { BadgeVisita } from "@/components/painel/BadgeVisita";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { ExcluirDadosComprador } from "@/components/painel/ExcluirDadosComprador";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { buscarCliente, buscarConversaDoCorretor } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Cliente — Showing", robots: { index: false } };

const link = "inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline";

export default async function ClientePage({ params }: PageProps<"/painel/clientes/[id]">) {
  const { id } = await params;
  const corretor = await exigirCorretor();
  const cliente = await buscarCliente(corretor.id, id);
  if (!cliente) notFound();

  const conversas = (await Promise.all(cliente.conversaIds.map((cid) => buscarConversaDoCorretor(corretor.id, cid)))).flatMap((d) =>
    d ? [d.conversa] : [],
  );
  const visitas = [...cliente.visitas].sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/painel/clientes" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Voltar para os clientes
      </Link>

      <CabecalhoPagina
        rotulo="Cliente"
        titulo={cliente.nome}
        descricao={`Primeiro contato em ${formatarDataHora(cliente.primeiraConversaEm)} · última atividade em ${formatarDataHora(cliente.ultimaAtividade)}`}
      />

      <section aria-labelledby="contato" className="flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 id="contato" className="text-xl font-medium">Contato e perfil</h2>
        <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
          {cliente.telefone && (
            <div>
              <dt className="text-sm text-muted-foreground">Telefone</dt>
              <dd><a href={`tel:+55${cliente.telefone}`} className={link}><Phone className="size-4" aria-hidden />{formatarTelefone(cliente.telefone)}</a></dd>
            </div>
          )}
          {cliente.email && (
            <div>
              <dt className="text-sm text-muted-foreground">E-mail</dt>
              <dd><a href={`mailto:${cliente.email}`} className={link}><Mail className="size-4" aria-hidden />{cliente.email}</a></dd>
            </div>
          )}
          {cliente.pagamento && <div><dt className="text-sm text-muted-foreground">Forma de pagamento</dt><dd className="font-medium">{cliente.pagamento}</dd></div>}
          {cliente.prazo && <div><dt className="text-sm text-muted-foreground">Prazo</dt><dd className="font-medium">{cliente.prazo}</dd></div>}
          <div>
            <dt className="text-sm text-muted-foreground">Imóveis de interesse</dt>
            <dd className="font-medium">
              {cliente.imoveis.map((i, n) => (
                <span key={i.id}>
                  {n > 0 && ", "}
                  <Link href={`/painel/imoveis/${i.id}`} className="underline-offset-4 hover:underline">{i.titulo}</Link>
                </span>
              ))}
            </dd>
          </div>
          {cliente.consentimentoEm && (
            <div><dt className="text-sm text-muted-foreground">Autorizou guardar os dados em</dt><dd className="font-medium">{formatarDataHora(cliente.consentimentoEm)}</dd></div>
          )}
        </dl>
      </section>

      <section aria-labelledby="visitas" className="flex flex-col gap-3">
        <h2 id="visitas" className="text-xl font-medium">Visitas</h2>
        {visitas.length === 0 ? (
          <p className="text-muted-foreground">Este cliente ainda não pediu visita.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visitas.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                <span><strong>{formatarDataHora(v.dataHora)}</strong> · {v.imovelTitulo}</span>
                <span className="flex items-center gap-3">
                  <BadgeVisita status={v.status} />
                  <Link href="/painel/visitas" className="text-sm underline underline-offset-4">Gerenciar</Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="conversas" className="flex flex-col gap-3">
        <h2 id="conversas" className="text-xl font-medium">Conversas</h2>
        <ul className="flex flex-col gap-2">
          {conversas.map((c) => (
            <li key={c.id}>
              <Link href={`/painel/conversas/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted">
                <span>{formatarDataHora(c.atualizadaEm)} · {c.imovelTitulo}</span>
                <span className="text-sm text-muted-foreground">
                  {c.totalMensagens} {c.totalMensagens === 1 ? "mensagem" : "mensagens"}
                  {c.transferida ? " · passou para você" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="privacidade" className="flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 id="privacidade" className="text-xl font-medium">Privacidade</h2>
        <p className="text-sm text-muted-foreground">
          Se este comprador pediu para apagar os dados dele, faça aqui. Vale para todas as conversas dele com os seus imóveis.
        </p>
        <ExcluirDadosComprador tipo="cliente" id={cliente.id} />
      </section>
    </main>
  );
}
