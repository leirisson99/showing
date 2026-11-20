import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Eye, MessageSquare, Plus, UserRound } from "lucide-react";
import { BadgeVisita } from "@/components/painel/BadgeVisita";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { MarcarComoLida } from "@/components/painel/AcaoDeConversa";
import { CartaoMetrica } from "@/components/painel/CartaoMetrica";
import { ConfirmarVisitaRapido } from "@/components/painel/ConfirmarVisitaRapido";
import { botaoEscuro } from "@/components/site/estilos";
import { formatarDataHora } from "@/lib/format";
import { listarConversas, listarProximasVisitas } from "@/lib/painel/atendimentos";
import { listarImoveis } from "@/lib/painel/imoveis";
import { metricasDoCorretor } from "@/lib/painel/metricas";
import { buscarPerfil, perfilCompleto } from "@/lib/painel/perfil";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = {
  title: "Painel — Showing",
  robots: { index: false },
};

const secao = "flex flex-col gap-4 rounded-3xl bg-card p-6 ring-1 ring-foreground/10";
const linkTexto = "inline-flex min-h-11 w-fit items-center text-sm font-medium underline underline-offset-4";

export default async function PainelPage() {
  const corretor = await exigirCorretor();
  const imoveis = await listarImoveis(corretor.id);
  const perfilOk = perfilCompleto(await buscarPerfil(corretor.id));
  const proximas = await listarProximasVisitas(corretor.id);
  const naoLidas = (await listarConversas(corretor.id)).filter((c) => c.naoLida);
  const metricas = await metricasDoCorretor(corretor.id, 30);
  const contagem = (s: string) => imoveis.filter((i) => i.status === s).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8">
      <CabecalhoPagina
        rotulo="Visão geral"
        titulo={`Olá, ${corretor.name ?? corretor.email}`}
        descricao={
          imoveis.length > 0
            ? `${contagem("publicado")} publicado(s), ${contagem("rascunho")} rascunho(s) e ${contagem("vendido")} vendido(s).`
            : undefined
        }
        acao={
          imoveis.length > 0 ? (
            <Link href="/painel/imoveis/novo" className={botaoEscuro}>
              <Plus className="size-4" aria-hidden /> Novo imóvel
            </Link>
          ) : undefined
        }
      />

      {!perfilOk && (
        <p role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-aviso-bg p-4 text-aviso">
          <span>Complete seu perfil (nome e CRECI) para poder publicar imóveis.</span>
          <Link href="/painel/perfil" className={botaoEscuro}>
            Completar perfil
          </Link>
        </p>
      )}

      {imoveis.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-foreground/25 p-8">
          <p className="max-w-md text-lg">Cadastre seu primeiro imóvel para ter sua página e seu atendente.</p>
          <Link href="/painel/imoveis/novo" className={botaoEscuro}>
            <Plus className="size-4" aria-hidden /> Cadastrar primeiro imóvel
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="metricas" className="flex flex-col gap-3">
            <h2 id="metricas" className="text-xl font-medium">Últimos 30 dias</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <CartaoMetrica rotulo="Visualizações" valor={metricas.visualizacoes} Icone={Eye} />
              <CartaoMetrica rotulo="Conversas" valor={metricas.conversas} Icone={MessageSquare} />
              <CartaoMetrica rotulo="Contatos capturados" valor={metricas.contatos} Icone={UserRound} />
              <CartaoMetrica rotulo="Visitas pedidas" valor={metricas.visitas} Icone={CalendarCheck} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-labelledby="proximas" className={secao}>
              <h2 id="proximas" className="text-xl font-medium">Próximas visitas (7 dias)</h2>
              {proximas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma visita pedida ou confirmada para os próximos dias.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {proximas.slice(0, 4).map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3">
                      <span className="flex min-w-0 flex-col text-sm">
                        <strong>{formatarDataHora(v.dataHora)}</strong>
                        <span className="truncate text-muted-foreground">{v.comprador?.nome ?? "Comprador"}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <BadgeVisita status={v.status} />
                        {v.status === "pedida" && <ConfirmarVisitaRapido visitaId={v.id} />}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/painel/visitas" className={linkTexto}>
                Ver todas as visitas
              </Link>
            </section>

            <section aria-labelledby="transferidas" className={secao}>
              <h2 id="transferidas" className="text-xl font-medium">Conversas que passaram para você</h2>
              {naoLidas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conversa esperando resposta.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {naoLidas.slice(0, 4).map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={`/painel/conversas/${c.id}`} className="min-w-0 text-sm underline-offset-4 hover:underline">
                        <strong className="block truncate">{c.motivoTransferencia ?? "Conversa transferida"}</strong>
                        <span className="block truncate text-muted-foreground">{c.imovelTitulo}</span>
                      </Link>
                      <MarcarComoLida conversaId={c.id} />
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/painel/conversas" className={linkTexto}>
                Ver todas as conversas
              </Link>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
