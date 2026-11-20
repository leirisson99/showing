import type { Metadata } from "next";
import { ListaVisitas, type ItemVisita } from "@/components/painel/ListaVisitas";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { listarVisitas } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Visitas — Showing", robots: { index: false } };

export default async function VisitasPage() {
  const corretor = await exigirCorretor();
  const visitas = await listarVisitas(corretor.id);

  const itens: ItemVisita[] = visitas.map((v) => ({
    id: v.id,
    quando: formatarDataHora(v.dataHora),
    status: v.status,
    imovelId: v.imovelId,
    imovelTitulo: v.imovelTitulo,
    conversaId: v.conversaId,
    nome: v.comprador?.nome ?? null,
    telefone: v.comprador?.telefone ?? null,
    telefoneTexto: v.comprador?.telefone ? formatarTelefone(v.comprador.telefone) : null,
    email: v.comprador?.email ?? null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Visitas</h1>
        <p className="mt-1 text-muted-foreground">Pedidos de visita feitos pelos compradores. Só você confirma, realiza ou cancela.</p>
      </div>
      <ListaVisitas itens={itens} />
    </main>
  );
}
