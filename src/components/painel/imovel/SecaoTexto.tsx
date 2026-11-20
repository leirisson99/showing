"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { gerarDescricaoAction } from "@/app/(painel)/painel/imoveis/actions";
import { CampoTexto, type FormularioImovel } from "./campos";

export function SecaoTexto({ form }: { form: FormularioImovel }) {
  const { register, getValues, setValue, formState: { errors } } = form;
  const [gerando, iniciar] = useTransition();

  function gerar() {
    iniciar(async () => {
      const r = await gerarDescricaoAction(getValues());
      if (!r.ok) return void toast.error(r.erro);
      setValue("titulo", r.texto.titulo, { shouldDirty: true, shouldValidate: true });
      setValue("descricao", r.texto.descricao, { shouldDirty: true, shouldValidate: true });
      toast.success("Texto gerado. Revise antes de publicar.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start gap-2 rounded-2xl bg-muted/60 p-4">
        <Button type="button" variant="outline" className="h-11 rounded-full" disabled={gerando} onClick={gerar}>
          <Sparkles data-icon="inline-start" /> {gerando ? "Gerando…" : "Gerar título e descrição"}
        </Button>
        <p className="text-sm text-muted-foreground">Usa só os dados da ficha. O texto é um rascunho: revise e edite antes de publicar.</p>
      </div>
      <CampoTexto form={form} nome="titulo" rotulo="Título" registro={register("titulo")} />
      <Field data-invalid={!!errors.descricao}>
        <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
        <Textarea id="descricao" rows={9} aria-invalid={!!errors.descricao} {...register("descricao")} />
        <FieldError errors={[errors.descricao]} />
      </Field>
    </div>
  );
}
