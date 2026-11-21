"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, MessageSquare, Phone, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FiltroAbas } from "./FiltroAbas";
import type { StatusVisita } from "@/lib/painel/atendimentos";
import { BadgeVisita } from "./BadgeVisita";

export type ItemCliente = {
  id: string;
  nome: string;
  telefone: string | null;
  telefoneTexto: string | null;
  email: string | null;
  imoveis: string[];
  conversas: number;
  ultimaAtividade: string;
  transferida: boolean;
  /** Visita mais relevante: a próxima em aberto ou, se não houver, a mais recente. */
  visita: { status: StatusVisita; quando: string } | null;
};

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberta", rotulo: "Visita em aberto" },
  { valor: "sem", rotulo: "Sem visita" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const passa = (filtro: Filtro, c: ItemCliente) =>
  filtro === "todos" ||
  (filtro === "aberta" && (c.visita?.status === "pedida" || c.visita?.status === "confirmada")) ||
  (filtro === "sem" && c.visita === null);

export function ListaClientes({ itens }: { itens: ItemCliente[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const visiveis = itens.filter(
    (c) =>
      passa(filtro, c) &&
      (termo === "" || normalizar([c.nome, c.telefoneTexto ?? "", c.email ?? "", ...c.imoveis].join(" ")).includes(termo)),
  );

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-foreground/25 p-10 text-center">
        <Users className="size-8 text-muted-foreground" aria-hidden />
        <p className="max-w-sm text-muted-foreground">
          Nenhum cliente ainda. Quando um comprador deixar nome e contato na conversa e autorizar, ele aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FiltroAbas filtros={FILTROS} valor={filtro} onChange={setFiltro} rotulo="Filtrar clientes" />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label="Buscar cliente por nome, contato ou imóvel"
            placeholder="Buscar por nome, contato ou imóvel"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-11 rounded-full pl-9 text-base"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status">
        {visiveis.length} {visiveis.length === 1 ? "cliente" : "clientes"}
      </p>

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 [&>li]:min-w-0">
          {visiveis.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/painel/clientes/${c.id}`}
                    className="text-lg font-semibold underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {c.nome}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{c.imoveis.join(" · ")}</p>
                </div>
                {c.visita && <BadgeVisita status={c.visita.status} />}
              </div>

              <div className="flex flex-wrap items-center gap-x-5">
                {c.telefone && (
                  <a href={`tel:+55${c.telefone}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline">
                    <Phone className="size-4" aria-hidden /> {c.telefoneTexto}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm underline-offset-4 hover:underline">
                    <Mail className="size-4" aria-hidden /> {c.email}
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="size-4" aria-hidden /> {c.conversas} {c.conversas === 1 ? "conversa" : "conversas"}
                </span>
                {c.visita && <span>Visita: {c.visita.quando}</span>}
                <span>Última atividade: {c.ultimaAtividade}</span>
                {c.transferida && <span className="font-medium text-aviso">Esperando resposta sua</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
