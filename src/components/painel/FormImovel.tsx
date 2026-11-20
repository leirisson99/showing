"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch, type FieldError, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError as MensagemErro, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { gerarDescricaoAction, salvarImovel } from "@/app/(painel)/painel/imoveis/actions";
import { CARACTERISTICAS_COMUNS, FINALIDADES, TIPOS, imovelSchema, type DadosImovel } from "@/lib/painel/schema";
import { cn } from "@/lib/utils";

const VAZIO = {
  tipo: undefined,
  finalidade: "venda",
  titulo: "",
  descricao: "",
  bairro: "",
  cidade: "Blumenau",
  endereco: null,
  mostrarEndereco: false,
  preco: undefined,
  condominio: null,
  iptu: null,
  quartos: undefined,
  suites: null,
  banheiros: undefined,
  vagas: undefined,
  areaM2: undefined,
  aceitaFinanciamento: false,
  aceitaFgts: false,
  caracteristicas: [],
  infoAdicional: null,
} as unknown as DadosImovel;

// Campos opcionais: texto vazio vira null.
// O RHF também aplica isto ao valor inicial, que pode ser null.
const textoOuNulo = (v: string | null | undefined) => (v == null || v.trim() === "" ? null : v);
const numeroOuNulo = (v: unknown) => (v === "" || v == null ? null : Number(v));

const itensTipo = Object.entries(TIPOS).map(([value, label]) => ({ value, label }));
const itensFinalidade = Object.entries(FINALIDADES).map(([value, label]) => ({ value, label }));

type Props = { imovelId?: string; valores?: DadosImovel };

export function FormImovel({ imovelId, valores }: Props) {
  const router = useRouter();
  const [salvando, iniciarSalvar] = useTransition();
  const [gerando, iniciarGerar] = useTransition();
  const [novaCaracteristica, setNovaCaracteristica] = useState("");

  const form = useForm<DadosImovel>({
    resolver: zodResolver(imovelSchema),
    defaultValues: valores ?? VAZIO,
  });
  const { register, control, handleSubmit, formState: { errors }, getValues, setValue } = form;

  const caracteristicas = useWatch({ control, name: "caracteristicas" });
  const todasCaracteristicas = [...new Set([...CARACTERISTICAS_COMUNS, ...caracteristicas])];

  function alternar(item: string) {
    const atual = getValues("caracteristicas");
    setValue("caracteristicas", atual.includes(item) ? atual.filter((c) => c !== item) : [...atual, item], { shouldDirty: true });
  }

  function adicionarCaracteristica() {
    const item = novaCaracteristica.trim();
    if (!item) return;
    if (!getValues("caracteristicas").includes(item)) {
      setValue("caracteristicas", [...getValues("caracteristicas"), item], { shouldDirty: true });
    }
    setNovaCaracteristica("");
  }

  function gerarTexto() {
    iniciarGerar(async () => {
      const r = await gerarDescricaoAction(getValues());
      if (!r.ok) return void toast.error(r.erro);
      setValue("titulo", r.texto.titulo, { shouldDirty: true, shouldValidate: true });
      setValue("descricao", r.texto.descricao, { shouldDirty: true, shouldValidate: true });
      toast.success("Texto gerado. Revise antes de salvar.");
    });
  }

  const salvar = handleSubmit((dados) => {
    iniciarSalvar(async () => {
      try {
        const r = await salvarImovel(imovelId ?? null, dados);
        if (!r.ok) return void toast.error(r.erro);
        toast.success("Imóvel salvo");
        if (!imovelId) router.push(`/painel/imoveis/${r.id}`);
        else router.refresh();
      } catch {
        toast.error("Não foi possível salvar. Tente de novo.");
      }
    });
  });

  const erro = (campo: keyof DadosImovel) => errors[campo] as FieldError | undefined;
  const campo = (nome: keyof DadosImovel, rotulo: string, props: UseFormRegisterReturn & { type?: string; placeholder?: string; inputMode?: "numeric" | "decimal"; step?: string }, dica?: string) => (
    <Field data-invalid={!!erro(nome)}>
      <FieldLabel htmlFor={nome}>{rotulo}</FieldLabel>
      <Input id={nome} aria-invalid={!!erro(nome)} className="h-11" {...props} />
      {dica && <FieldDescription>{dica}</FieldDescription>}
      <MensagemErro errors={[erro(nome)]} />
    </Field>
  );

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-10">
      <FieldSet>
        <FieldLegend>Dados do imóvel</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.tipo}>
            <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
            <Controller control={control} name="tipo" render={({ field }) => (
              <Select items={itensTipo} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="tipo" className="h-11 w-full" aria-invalid={!!errors.tipo}><SelectValue placeholder="Escolha o tipo" /></SelectTrigger>
                <SelectContent>{itensTipo.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <MensagemErro errors={[errors.tipo]} />
          </Field>
          <Field data-invalid={!!errors.finalidade}>
            <FieldLabel htmlFor="finalidade">Finalidade</FieldLabel>
            <Controller control={control} name="finalidade" render={({ field }) => (
              <Select items={itensFinalidade} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="finalidade" className="h-11 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{itensFinalidade.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <MensagemErro errors={[errors.finalidade]} />
          </Field>
          {campo("bairro", "Bairro", register("bairro"))}
          {campo("cidade", "Cidade", register("cidade"))}
          <div className="sm:col-span-2">
            {campo("endereco", "Endereço (opcional)", register("endereco", { setValueAs: textoOuNulo }), "Só aparece na página se você ativar a opção abaixo.")}
          </div>
          <Field orientation="horizontal" className="sm:col-span-2">
            <Controller control={control} name="mostrarEndereco" render={({ field }) => (
              <Switch id="mostrarEndereco" checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <FieldLabel htmlFor="mostrarEndereco">Mostrar endereço completo na página</FieldLabel>
          </Field>
          {campo("preco", "Preço (R$)", register("preco", { valueAsNumber: true }), undefined)}
          {campo("areaM2", "Área (m²)", register("areaM2", { valueAsNumber: true }))}
          {campo("condominio", "Condomínio (R$, opcional)", register("condominio", { setValueAs: numeroOuNulo }))}
          {campo("iptu", "IPTU (R$, opcional)", register("iptu", { setValueAs: numeroOuNulo }))}
          {campo("quartos", "Quartos", register("quartos", { valueAsNumber: true }))}
          {campo("suites", "Suítes (opcional)", register("suites", { setValueAs: numeroOuNulo }))}
          {campo("banheiros", "Banheiros", register("banheiros", { valueAsNumber: true }))}
          {campo("vagas", "Vagas de garagem", register("vagas", { valueAsNumber: true }))}
          <Field orientation="horizontal">
            <Controller control={control} name="aceitaFinanciamento" render={({ field }) => (
              <Switch id="aceitaFinanciamento" checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <FieldLabel htmlFor="aceitaFinanciamento">Aceita financiamento</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Controller control={control} name="aceitaFgts" render={({ field }) => (
              <Switch id="aceitaFgts" checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <FieldLabel htmlFor="aceitaFgts">Aceita FGTS</FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Título e descrição</FieldLegend>
        <FieldGroup>
          <div className="flex flex-col items-start gap-1">
            <Button type="button" variant="outline" className="h-11" disabled={gerando} onClick={gerarTexto}>
              <Sparkles data-icon="inline-start" />
              {gerando ? "Gerando…" : "Gerar título e descrição"}
            </Button>
            <p className="text-sm text-muted-foreground">Usa só os dados acima. Você revisa e edita antes de salvar.</p>
          </div>
          {campo("titulo", "Título", register("titulo"))}
          <Field data-invalid={!!errors.descricao}>
            <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
            <Textarea id="descricao" rows={8} aria-invalid={!!errors.descricao} {...register("descricao")} />
            <MensagemErro errors={[errors.descricao]} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Características</FieldLegend>
        <ul className="flex flex-wrap gap-2">
          {todasCaracteristicas.map((item) => {
            const ativa = caracteristicas.includes(item);
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => alternar(item)}
                  className={cn(
                    "h-11 rounded-full border px-4 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    ativa ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
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
            value={novaCaracteristica}
            onChange={(e) => setNovaCaracteristica(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarCaracteristica();
              }
            }}
          />
          <Button type="button" variant="outline" className="h-11" onClick={adicionarCaracteristica}>
            <Plus data-icon="inline-start" /> Adicionar
          </Button>
        </div>
        <Field data-invalid={!!errors.infoAdicional}>
          <FieldLabel htmlFor="infoAdicional">Informações adicionais para o atendente (opcional)</FieldLabel>
          <Textarea id="infoAdicional" rows={4} {...register("infoAdicional", { setValueAs: textoOuNulo })} />
          <FieldDescription>O atendente usa este texto para responder dúvidas. Ex.: aceita pet, data de entrega das chaves.</FieldDescription>
          <MensagemErro errors={[errors.infoAdicional]} />
        </Field>
      </FieldSet>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-11 px-5 text-base" disabled={salvando}>
          {salvando ? "Salvando…" : imovelId ? "Salvar alterações" : "Salvar e continuar para as fotos"}
        </Button>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">Corrija os campos destacados para salvar.</p>
        )}
      </div>
    </form>
  );
}
