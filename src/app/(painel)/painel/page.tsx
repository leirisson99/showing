import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BadgeVisita } from "@/components/painel/BadgeVisita";
import { buttonVariants } from "@/components/ui/button";
import { formatarDataHora } from "@/lib/format";
import { listarConversas, listarProximasVisitas } from "@/lib/painel/atendimentos";
import { listarImoveis } from "@/lib/painel/imoveis";
import { buscarPerfil, perfilCompleto } from "@/lib/painel/perfil";
import { exigirCorretor } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Painel — Showing",
  robots: { index: false },
};

export default async function PainelPage() {
  const corretor = await exigirCorretor();
  const imoveis = await listarImoveis(corretor.id);
  const perfilOk = perfilCompleto(await buscarPerfil(corretor.id));
  const proximas = await listarProximasVisitas(corretor.id);
  const transferidas = (await listarConversas(corretor.id)).filter((c) => c.transferida);
  const contagem = (s: string) => imoveis.filter((i) => i.status === s).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-[26px] font-bold lg:text-[32px]">Olá, {corretor.name ?? corretor.email}</h1>
      {!perfilOk && (
        <p role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FFF4E0] p-4 text-[#7A4A00]">
          <span>Complete seu perfil (nome e CRECI) para poder publicar imóveis.</span>
          <Link href="/painel/perfil" className={cn(buttonVariants(), "h-11 rounded-full px-5")}>
            Completar perfil
          </Link>
        </p>
      )}
      {imoveis.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed p-6">
          <p className="text-muted-foreground">Cadastre seu primeiro imóvel para ter sua página e seu atendente.</p>
          <Link href="/painel/imoveis/novo" className={cn(buttonVariants(), "h-11 px-4 text-base")}>
            <Plus data-icon="inline-start" /> Cadastrar primeiro imóvel
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              ["Publicados", contagem("publicado")],
              ["Rascunhos", contagem("rascunho")],
              ["Vendidos", contagem("vendido")],
            ].map(([rotulo, n]) => (
              <li key={rotulo} className="rounded-xl border bg-card p-4">
                <p className="font-heading text-3xl font-bold">{n}</p>
                <p className="text-sm text-muted-foreground">{rotulo}</p>
              </li>
            ))}
          </ul>
          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-labelledby="proximas" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 id="proximas" className="text-lg font-semibold">Próximas visitas (7 dias)</h2>
              {proximas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma visita pedida ou confirmada para os próximos dias.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {proximas.slice(0, 3).map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <strong>{formatarDataHora(v.dataHora)}</strong> · {v.comprador?.nome ?? "Comprador"}
                      </span>
                      <BadgeVisita status={v.status} />
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/painel/visitas" className="inline-flex min-h-11 w-fit items-center text-sm underline underline-offset-4">Ver todas as visitas</Link>
            </section>
            <section aria-labelledby="transferidas" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 id="transferidas" className="text-lg font-semibold">Conversas que passaram para você</h2>
              {transferidas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conversa esperando resposta.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {transferidas.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <Link href={`/painel/conversas/${c.id}`} className="underline-offset-4 hover:underline">{c.motivoTransferencia ?? "Conversa transferida"}</Link>
                      <span className="text-muted-foreground"> · {c.imovelTitulo}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/painel/conversas" className="inline-flex min-h-11 w-fit items-center text-sm underline underline-offset-4">Ver todas as conversas</Link>
            </section>
          </div>
          <div>
            <Link href="/painel/imoveis" className={cn(buttonVariants(), "h-11 px-4 text-base")}>
              Ver meus imóveis
            </Link>
          </div>
        </>
      )}
      <p className="text-sm text-muted-foreground">As métricas por imóvel entram numa próxima etapa.</p>
    </main>
  );
}
