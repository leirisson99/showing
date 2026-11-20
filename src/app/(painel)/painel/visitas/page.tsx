import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/painel/CabecalhoPagina";
import { ListaVisitas, type ItemVisita } from "@/components/painel/ListaVisitas";
import { formatarTelefone } from "@/lib/format";
import { listarVisitas } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Visitas — Showing", robots: { index: false } };

const FUSO = "America/Sao_Paulo";
const chaveDoDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }); // AAAA-MM-DD
const textoDoDia = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSO });
const horaDoDia = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: FUSO });

export default async function VisitasPage() {
  const corretor = await exigirCorretor();
  const visitas = await listarVisitas(corretor.id);

  const itens: ItemVisita[] = visitas.map((v) => ({
    id: v.id,
    dia: chaveDoDia.format(v.dataHora),
    diaTexto: textoDoDia.format(v.dataHora),
    hora: horaDoDia.format(v.dataHora),
    status: v.status,
    imovelId: v.imovelId,
    imovelTitulo: v.imovelTitulo,
    conversaId: v.conversaId,
    nome: v.comprador?.nome ?? null,
    telefone: v.comprador?.telefone ?? null,
    telefoneTexto: v.comprador?.telefone ? formatarTelefone(v.comprador.telefone) : null,
    email: v.comprador?.email ?? null,
    pagamento: v.comprador?.pagamento ?? null,
    prazo: v.comprador?.prazo ?? null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <CabecalhoPagina
        rotulo="Agenda"
        titulo="Visitas"
        descricao="Pedidos de visita feitos pelos compradores, por dia. Só você confirma, realiza ou cancela."
      />
      <ListaVisitas itens={itens} />
    </main>
  );
}
