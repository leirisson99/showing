"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salvarPerfilAction } from "@/app/(painel)/painel/perfil/actions";
import { DURACOES_VISITA, perfilSchema, type DadosPerfil } from "@/lib/painel/perfil-schema";
import { FOTO_MAX_BYTES, FOTO_TIPOS } from "@/lib/painel/schema";
import { SeletorHorarios } from "./SeletorHorarios";

const itensDuracao = DURACOES_VISITA.map((m) => ({ value: String(m), label: `${m} minutos` }));

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

type Props = { valores: DadosPerfil; fotoSrc: string | null; email: string };

export function FormPerfil({ valores, fotoSrc, email }: Props) {
  const router = useRouter();
  const [salvando, iniciarSalvar] = useTransition();
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const entradaFoto = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<DadosPerfil>({
    resolver: zodResolver(perfilSchema),
    defaultValues: valores,
  });
  const nome = useWatch({ control, name: "nome" });

  const salvar = handleSubmit((dados) => {
    iniciarSalvar(async () => {
      try {
        const r = await salvarPerfilAction(dados);
        if (!r.ok) return void toast.error(r.erro);
        toast.success("Perfil salvo");
        router.refresh();
      } catch {
        toast.error("Não foi possível salvar. Tente de novo.");
      }
    });
  });

  async function enviarFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    if (!(FOTO_TIPOS as readonly string[]).includes(arquivo.type)) return void toast.error("Use uma foto JPG, PNG ou WebP.");
    if (arquivo.size > FOTO_MAX_BYTES) return void toast.error("A foto deve ter no máximo 10 MB.");

    setEnviandoFoto(true);
    const corpo = new FormData();
    corpo.set("alvo", "perfil");
    corpo.set("arquivo", arquivo);
    try {
      const resposta = await fetch("/api/upload", { method: "POST", body: corpo });
      if (!resposta.ok) throw new Error((await resposta.json().catch(() => null))?.erro ?? "falha no envio");
      toast.success("Foto atualizada");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (entradaFoto.current) entradaFoto.current.value = "";
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-10">
      <FieldSet className="rounded-3xl bg-card p-6 ring-1 ring-foreground/10">
        <FieldLegend className="text-xl font-medium">Seus dados</FieldLegend>
        <p className="text-sm text-muted-foreground">Nome, CRECI, WhatsApp e foto aparecem na página pública dos seus imóveis.</p>

        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            {fotoSrc && <AvatarImage src={fotoSrc} alt={`Foto de ${nome || "corretor"}`} />}
            <AvatarFallback className="text-lg">{iniciais(nome || "?")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start gap-1">
            <input
              ref={entradaFoto}
              id="foto-perfil"
              type="file"
              accept={FOTO_TIPOS.join(",")}
              className="sr-only"
              onChange={(e) => void enviarFoto(e.target.files?.[0])}
            />
            <Button type="button" variant="outline" className="h-11 rounded-full" disabled={enviandoFoto} onClick={() => entradaFoto.current?.click()}>
              <Camera data-icon="inline-start" /> {enviandoFoto ? "Enviando…" : fotoSrc ? "Trocar foto" : "Enviar foto"}
            </Button>
            <p className="text-sm text-muted-foreground">JPG, PNG ou WebP, até 10 MB.</p>
          </div>
        </div>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.nome}>
            <FieldLabel htmlFor="nome">Nome</FieldLabel>
            <Input id="nome" className="h-11" autoComplete="name" aria-invalid={!!errors.nome} {...register("nome")} />
            <FieldError errors={[errors.nome]} />
          </Field>
          <Field data-invalid={!!errors.creci}>
            <FieldLabel htmlFor="creci">CRECI</FieldLabel>
            <Input id="creci" className="h-11" placeholder="CRECI-SC 00000" aria-invalid={!!errors.creci} {...register("creci")} />
            <FieldError errors={[errors.creci]} />
          </Field>
          <Field data-invalid={!!errors.whatsapp}>
            <FieldLabel htmlFor="whatsapp">WhatsApp (opcional)</FieldLabel>
            <Input id="whatsapp" className="h-11" type="tel" inputMode="tel" autoComplete="tel" placeholder="(47) 99999-0000" aria-invalid={!!errors.whatsapp} {...register("whatsapp")} />
            <FieldDescription>Aparece na página como link, só quando o imóvel é vendido.</FieldDescription>
            <FieldError errors={[errors.whatsapp]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail de acesso</FieldLabel>
            <Input id="email" className="h-11" value={email} readOnly disabled />
            <FieldDescription>Usado no login e nos avisos. Não é exibido na página.</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="rounded-3xl bg-card p-6 ring-1 ring-foreground/10">
        <FieldLegend className="text-xl font-medium">Horários de visita</FieldLegend>
        <p className="text-sm text-muted-foreground">
          O atendente só oferece estes horários ao comprador, com pelo menos 12 horas de antecedência e até 14 dias à frente. Um horário
          ocupado por visita pedida ou confirmada deixa de ser oferecido.
        </p>
        <Field data-invalid={!!errors.duracaoVisitaMin}>
          <FieldLabel htmlFor="duracao">Duração de cada visita</FieldLabel>
          <Controller
            control={control}
            name="duracaoVisitaMin"
            render={({ field }) => (
              <Select items={itensDuracao} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger id="duracao" className="h-11 w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itensDuracao.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.duracaoVisitaMin]} />
        </Field>
        <Controller control={control} name="horariosVisita" render={({ field }) => <SeletorHorarios value={field.value} onChange={field.onChange} />} />
        {errors.horariosVisita && <p role="alert" className="text-sm text-destructive">Revise os horários: use o formato HH:MM, sem repetir no mesmo dia.</p>}
      </FieldSet>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-11 rounded-full px-6 text-base" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar perfil"}
        </Button>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-destructive">Corrija os campos destacados para salvar.</p>}
      </div>
    </form>
  );
}
