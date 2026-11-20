import type { Metadata } from "next";
import { ListaClientes, type ItemCliente } from "@/components/painel/ListaClientes";
import { formatarDataHora, formatarTelefone } from "@/lib/format";
import { listarClientes, type ClientePainel } from "@/lib/painel/atendimentos";
import { exigirCorretor } from "@/lib/session";

export const metadata: Metadata = { title: "Clientes — Showing", robots: { index: false } };

// Visita mais relevante: a próxima em aberto; sem ela, a mais recente.
function visitaDestaque(c: ClientePainel) {
  const emAberto = c.visitas.filter((v) => v.status === "pedida" || v.status === "confirmada").sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());
  const recente = [...c.visitas].sort((a, b) => b.dataHora.getTime() - a.dataHora.getTime());
  return emAberto[0] ?? recente[0] ?? null;
}

export default async function ClientesPage() {
  const corretor = await exigirCorretor();
  const clientes = await listarClientes(corretor.id);

  const itens: ItemCliente[] = clientes.map((c) => {
    const v = visitaDestaque(c);
    return {
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      telefoneTexto: c.telefone ? formatarTelefone(c.telefone) : null,
      email: c.email,
      imoveis: c.imoveis.map((i) => i.titulo),
      conversas: c.conversaIds.length,
      ultimaAtividade: formatarDataHora(c.ultimaAtividade),
      transferida: c.transferida,
      visita: v ? { status: v.status, quando: formatarDataHora(v.dataHora) } : null,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-[26px] font-bold lg:text-[32px]">Clientes</h1>
        <p className="mt-1 text-muted-foreground">
          Compradores que deixaram nome e contato e autorizaram guardar os dados. Só você vê esta lista.
        </p>
      </div>
      <ListaClientes itens={itens} />
    </main>
  );
}
