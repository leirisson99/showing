"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DiaSemana, HorariosVisita } from "@/lib/ai/horarios";
import { DIAS_DA_SEMANA, MAX_HORARIOS_POR_DIA } from "@/lib/painel/perfil-schema";

type Props = {
  value: HorariosVisita;
  onChange: (valor: HorariosVisita) => void;
};

// Horários em que o corretor faz visitas, por dia da semana. O atendente só oferece estes
// horários (RN-17), com antecedência mínima de 12 h e até 14 dias à frente.
export function SeletorHorarios({ value, onChange }: Props) {
  const [novo, setNovo] = useState<Partial<Record<DiaSemana, string>>>({});
  const [erro, setErro] = useState<{ dia: DiaSemana; texto: string } | null>(null);

  function adicionar(dia: DiaSemana) {
    const hora = novo[dia];
    const atuais = value[dia] ?? [];
    if (!hora) return setErro({ dia, texto: "Escolha um horário." });
    if (atuais.includes(hora)) return setErro({ dia, texto: "Esse horário já está na lista." });
    if (atuais.length >= MAX_HORARIOS_POR_DIA) return setErro({ dia, texto: `No máximo ${MAX_HORARIOS_POR_DIA} horários por dia.` });
    setErro(null);
    onChange({ ...value, [dia]: [...atuais, hora].sort() });
    setNovo((n) => ({ ...n, [dia]: "" }));
  }

  function remover(dia: DiaSemana, hora: string) {
    onChange({ ...value, [dia]: (value[dia] ?? []).filter((h) => h !== hora) });
  }

  return (
    <ul className="flex flex-col divide-y rounded-2xl border bg-card">
      {DIAS_DA_SEMANA.map(({ chave, rotulo }) => {
        const horas = value[chave] ?? [];
        return (
          <li key={chave} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:gap-6">
            <p className="w-36 shrink-0 pt-2 font-medium">{rotulo}</p>
            <div className="flex flex-1 flex-col gap-3">
              {horas.length === 0 ? (
                <p className="pt-2 text-sm text-muted-foreground">Sem visitas neste dia.</p>
              ) : (
                <ul className="flex flex-wrap gap-2" aria-label={`Horários de ${rotulo}`}>
                  {horas.map((h) => (
                    <li key={h} className="flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 text-sm font-medium">
                      {h}
                      <button
                        type="button"
                        onClick={() => remover(chave, h)}
                        aria-label={`Remover ${h} de ${rotulo}`}
                        className="flex size-8 items-center justify-center rounded-full hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="time"
                  aria-label={`Novo horário de ${rotulo}`}
                  value={novo[chave] ?? ""}
                  onChange={(e) => setNovo((n) => ({ ...n, [chave]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionar(chave);
                    }
                  }}
                  className="h-11 w-36 text-base"
                />
                <Button type="button" variant="outline" className="h-11 rounded-full" onClick={() => adicionar(chave)}>
                  <Plus data-icon="inline-start" /> Adicionar
                </Button>
              </div>
              {erro?.dia === chave && (
                <p role="alert" className="text-sm text-destructive">
                  {erro.texto}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
