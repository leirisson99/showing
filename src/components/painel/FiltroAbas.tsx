"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props<T extends string> = {
  filtros: readonly { valor: T; rotulo: string }[];
  valor: T;
  onChange: (valor: T) => void;
  /** Nome para leitores de tela, ex.: "Filtrar imóveis". */
  rotulo: string;
};

// Filtro em abas das listas do painel. Numa linha só: no celular rola na horizontal em vez
// de quebrar e sobrepor os rótulos.
export function FiltroAbas<T extends string>({ filtros, valor, onChange, rotulo }: Props<T>) {
  return (
    <Tabs value={valor} onValueChange={(v) => onChange(v as T)} className="max-w-full">
      <TabsList
        aria-label={rotulo}
        className="group-data-horizontal/tabs:h-11 w-full max-w-full justify-start gap-1 overflow-x-auto rounded-full bg-secondary p-1 sm:w-fit"
      >
        {filtros.map((f) => (
          <TabsTrigger key={f.valor} value={f.valor} className="h-9 flex-none rounded-full px-4">
            {f.rotulo}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
