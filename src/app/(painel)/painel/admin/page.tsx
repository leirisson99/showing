import type { Metadata } from "next";
import { Bot, FileText, Footprints, Users } from "lucide-react";
import { BarrasPorPeriodo } from "@/components/painel/admin/BarrasPorPeriodo";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { CartaoMetrica } from "@/components/painel/CartaoMetrica";
import { formatarData, formatarDataHora } from "@/lib/format";
import { resumoAdmin } from "@/lib/painel/admin-db";
import { lerPagina, type Gasto } from "@/lib/painel/admin";
import { PaginacaoAdmin } from "@/components/painel/admin/PaginacaoAdmin";
import { exigirAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin — Showing", robots: { index: false } };

const dolar = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
const numero = new Intl.NumberFormat("pt-BR");
const NOME_TIPO: Record<string, string> = { chat: "Atendente (chat)", descricao: "Descrição do imóvel", pagina: "Página do imóvel" };

function textoGasto(g: Gasto) {
  return g.custo === null ? `${numero.format(g.entrada + g.saida)} tokens` : dolar.format(g.custo);
}

export default async function AdminPage({ searchParams }: PageProps<"/painel/admin">) {
  await exigirAdmin();
  const pagina = lerPagina((await searchParams).pagina);
  const r = await resumoAdmin(new Date(), pagina);
  const semPreco = r.gasto.dia30.custo === null;
  const custoPorVisita = r.gasto.dia30.custo !== null && r.visitas30 > 0 ? dolar.format(r.gasto.dia30.custo / r.visitas30) : "—";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8">
      <CabecalhoPagina rotulo="Administração" titulo="Gasto, corretores e páginas" descricao="Visão da POC inteira. Mostra só contagens e dados dos corretores, nada dos compradores." />

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoMetrica rotulo="Corretores" valor={r.usuarios.total} Icone={Users} />
        <CartaoMetrica rotulo="Páginas publicadas" valor={r.paginas.porStatus.publicado} Icone={FileText} detalhe={`${r.paginas.porStatus.rascunho} rascunhos · ${r.paginas.porStatus.vendido} vendidos`} />
        <CartaoMetrica rotulo="Chamadas de IA (30 dias)" valor={r.gasto.dia30.chamadas} Icone={Bot} detalhe={`Gasto: ${textoGasto(r.gasto.dia30)}`} />
        <CartaoMetrica rotulo="Visitas pedidas (30 dias)" valor={r.visitas30} Icone={Footprints} detalhe={`Custo de IA por visita: ${custoPorVisita}`} />
      </section>

      <section aria-labelledby="gasto" className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 id="gasto" className="text-xl font-medium">Gasto de IA</h2>
        {semPreco && <p className="text-sm text-muted-foreground">Defina AI_PRECO_ENTRADA e AI_PRECO_SAIDA (US$ por 1 milhão de tokens) para ver o valor em dólar. Por enquanto mostro tokens.</p>}
        <dl className="grid gap-4 sm:grid-cols-3">
          {[["Últimos 7 dias", r.gasto.dia7], ["Últimos 30 dias", r.gasto.dia30], ["Total", r.gasto.total]].map(([rotulo, g]) => (
            <div key={rotulo as string}>
              <dt className="text-sm text-muted-foreground">{rotulo as string}</dt>
              <dd className="text-2xl font-medium tabular-nums">{textoGasto(g as Gasto)}</dd>
              <dd className="text-xs text-muted-foreground">{numero.format((g as Gasto).chamadas)} chamadas</dd>
            </div>
          ))}
        </dl>
        <BarrasPorPeriodo
          titulo="Gasto por dia (30 dias)"
          itens={r.gastoPorDia.map((d) => ({ rotulo: d.dia.slice(8) + "/" + d.dia.slice(5, 7), valor: d.custo ?? d.entrada + d.saida, texto: textoGasto(d) }))}
        />
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Gasto por tipo, últimos 30 dias</caption>
          <thead className="text-muted-foreground"><tr><th className="py-2 font-medium">Tipo</th><th className="font-medium">Chamadas</th><th className="font-medium">Tokens (entrada / saída)</th><th className="text-right font-medium">Gasto</th></tr></thead>
          <tbody>
            {r.gastoPorTipo.map((t) => (
              <tr key={t.tipo} className="border-t">
                <td className="py-2">{NOME_TIPO[t.tipo] ?? t.tipo}</td>
                <td className="tabular-nums">{numero.format(t.chamadas)}</td>
                <td className="tabular-nums">{numero.format(t.entrada)} / {numero.format(t.saida)}</td>
                <td className="text-right tabular-nums">{textoGasto(t)}</td>
              </tr>
            ))}
            {r.gastoPorTipo.length === 0 && <tr className="border-t"><td colSpan={4} className="py-3 text-muted-foreground">Nenhum uso nos últimos 30 dias.</td></tr>}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="corretores" className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 id="corretores" className="text-xl font-medium">Corretores</h2>
        <BarrasPorPeriodo titulo="Cadastros por semana (8 semanas)" itens={r.usuarios.porSemana.map((s) => ({ rotulo: formatarData(s.inicio).slice(0, 6), valor: s.total, texto: String(s.total) }))} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Corretores e gasto de IA nos últimos 30 dias</caption>
            <thead className="text-muted-foreground"><tr><th className="py-2 font-medium">Corretor</th><th className="font-medium">Cadastro</th><th className="font-medium">Imóveis</th><th className="font-medium">Publicados</th><th className="text-right font-medium">Gasto (30 dias)</th></tr></thead>
            <tbody>
              {r.usuarios.lista.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2"><span className="block font-medium">{u.nome ?? "Sem nome"}</span><span className="text-muted-foreground">{u.email}</span></td>
                  <td>{formatarData(u.criadoEm)}</td>
                  <td className="tabular-nums">{u.imoveis}</td>
                  <td className="tabular-nums">{u.publicados}</td>
                  <td className="text-right tabular-nums">{textoGasto(u.gasto30)}</td>
                </tr>
              ))}
              {r.usuarios.gastoSemDono.chamadas > 0 && (
                <tr className="border-t text-muted-foreground"><td className="py-2" colSpan={4}>Sem corretor identificado (uso antigo)</td><td className="text-right tabular-nums">{textoGasto(r.usuarios.gastoSemDono)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="paginas" className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 id="paginas" className="text-xl font-medium">Páginas criadas</h2>
        <BarrasPorPeriodo titulo="Imóveis criados por semana (8 semanas)" itens={r.paginas.porSemana.map((s) => ({ rotulo: formatarData(s.inicio).slice(0, 6), valor: s.total, texto: String(s.total) }))} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Imóveis criados, do mais recente ao mais antigo</caption>
            <thead className="text-muted-foreground"><tr><th className="py-2 font-medium">Imóvel</th><th className="font-medium">Corretor</th><th className="font-medium">Status</th><th className="font-medium">Criado em</th></tr></thead>
            <tbody>
              {r.paginas.recentes.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="py-2">{i.status === "rascunho" ? (
                      <span className="font-medium">{i.titulo}<span className="block text-xs font-normal text-muted-foreground">Rascunho: a página pública ainda não existe</span></span>
                    ) : (
                      <a className="font-medium underline underline-offset-4" href={`/imovel/${i.slug}`} target="_blank" rel="noopener noreferrer">
                        {i.titulo}<span className="sr-only"> (abre em nova aba)</span>
                        <span className="block text-xs font-normal text-muted-foreground no-underline">/imovel/{i.slug}</span>
                      </a>
                    )}</td>
                  <td>{i.corretor}</td>
                  <td className="capitalize">{i.status}</td>
                  <td>{formatarDataHora(i.criadoEm)}</td>
                </tr>
              ))}
              {r.paginas.recentes.length === 0 && <tr className="border-t"><td colSpan={4} className="py-3 text-muted-foreground">Nenhum imóvel criado ainda.</td></tr>}
            </tbody>
          </table>
        </div>
        <PaginacaoAdmin pagina={r.paginas.pagina} totalPaginas={r.paginas.totalPaginas} />
      </section>
    </main>
  );
}
