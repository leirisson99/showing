"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CARACTERISTICAS_COMUNS } from "@/lib/painel/schema";
import { cn } from "@/lib/utils";
import { textoOuNulo, type FormularioImovel } from "./campos";

export function SecaoCaracteristicas({ form }: { form: FormularioImovel }) {
  const { register, control, getValues, setValue, formState: { errors } } = form;
  const [nova, setNova] = useState("");
  const caracteristicas = useWatch({ control, name: "caracteristicas" });
  const todas = [...new Set([...CARACTERISTICAS_COMUNS, ...caracteristicas])];

  function alternar(item: string) {
    const atual = getValues("caracteristicas");
    setValue("caracteristicas", atual.includes(item) ? atual.filter((c) => c !== item) : [...atual, item], { shouldDirty: true });
  }

  function adicionar() {
    const item = nova.trim();
    if (!item) return;
    if (!getValues("caracteristicas").includes(item)) {
      setValue("caracteristicas", [...getValues("caracteristicas"), item], { shouldDirty: true });
    }
    setNova("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Escolha o que vale destacar. Aparecem na página, na lista “Detalhes importantes”.</p>
        <ul className="flex flex-wrap gap-2">
          {todas.map((item) => {
            const ativa = caracteristicas.includes(item);
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => alternar(item)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    ativa ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                  )}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-2">
          <Input
            aria-label="Outra característica"
            placeholder="Outra característica"
            className="h-11"
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionar();
              }
            }}
          />
          <Button type="button" variant="outline" className="h-11 rounded-full" onClick={adicionar}>
            <Plus data-icon="inline-start" /> Adicionar
          </Button>
        </div>
      </div>

      <Field data-invalid={!!errors.infoAdicional}>
        <FieldLabel htmlFor="infoAdicional">Informações adicionais para o atendente (opcional)</FieldLabel>
        <Textarea id="infoAdicional" rows={4} {...register("infoAdicional", { setValueAs: textoOuNulo })} />
        <FieldDescription>O atendente usa este texto para responder dúvidas. Ex.: aceita pet, data de entrega das chaves.</FieldDescription>
        <FieldError errors={[errors.infoAdicional]} />
      </Field>
    </div>
  );
}
