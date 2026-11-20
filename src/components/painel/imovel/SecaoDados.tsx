"use client";

import { Controller } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FINALIDADES, TIPOS } from "@/lib/painel/schema";
import { CampoTexto, numeroOuNulo, textoOuNulo, type FormularioImovel } from "./campos";

const itensTipo = Object.entries(TIPOS).map(([value, label]) => ({ value, label }));
const itensFinalidade = Object.entries(FINALIDADES).map(([value, label]) => ({ value, label }));

// Dados da ficha. Campos que o atendente usa para responder: preço, condomínio, medidas, etc.
export function SecaoDados({ form }: { form: FormularioImovel }) {
  const { register, control, formState: { errors } } = form;

  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field data-invalid={!!errors.tipo}>
        <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
        <Controller control={control} name="tipo" render={({ field }) => (
          <Select items={itensTipo} value={field.value ?? null} onValueChange={field.onChange}>
            <SelectTrigger id="tipo" className="h-11 w-full" aria-invalid={!!errors.tipo}><SelectValue placeholder="Escolha o tipo" /></SelectTrigger>
            <SelectContent>{itensTipo.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        <FieldError errors={[errors.tipo]} />
      </Field>
      <Field data-invalid={!!errors.finalidade}>
        <FieldLabel htmlFor="finalidade">Finalidade</FieldLabel>
        <Controller control={control} name="finalidade" render={({ field }) => (
          <Select items={itensFinalidade} value={field.value ?? null} onValueChange={field.onChange}>
            <SelectTrigger id="finalidade" className="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{itensFinalidade.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
          </Select>
        )} />
        <FieldError errors={[errors.finalidade]} />
      </Field>

      <CampoTexto form={form} nome="bairro" rotulo="Bairro" registro={register("bairro")} />
      <CampoTexto form={form} nome="cidade" rotulo="Cidade" registro={register("cidade")} />
      <div className="sm:col-span-2">
        <CampoTexto form={form} nome="endereco" rotulo="Endereço (opcional)" registro={register("endereco", { setValueAs: textoOuNulo })} dica="Só aparece na página se você ativar a opção abaixo." />
      </div>
      <Field orientation="horizontal" className="sm:col-span-2">
        <Controller control={control} name="mostrarEndereco" render={({ field }) => (
          <Switch id="mostrarEndereco" checked={field.value} onCheckedChange={field.onChange} />
        )} />
        <FieldLabel htmlFor="mostrarEndereco">Mostrar endereço completo na página</FieldLabel>
      </Field>
      <CampoTexto form={form} nome="latitude" rotulo="Latitude (opcional)" inputMode="decimal" registro={register("latitude", { setValueAs: numeroOuNulo })} dica="Para o mapa. No Google Maps, clique com o botão direito no ponto e copie as coordenadas." />
      <CampoTexto form={form} nome="longitude" rotulo="Longitude (opcional)" inputMode="decimal" registro={register("longitude", { setValueAs: numeroOuNulo })} />

      <CampoTexto form={form} nome="preco" rotulo="Preço (R$)" inputMode="decimal" registro={register("preco", { valueAsNumber: true })} />
      <CampoTexto form={form} nome="areaM2" rotulo="Área (m²)" inputMode="decimal" registro={register("areaM2", { valueAsNumber: true })} />
      <CampoTexto form={form} nome="condominio" rotulo="Condomínio (R$, opcional)" inputMode="decimal" registro={register("condominio", { setValueAs: numeroOuNulo })} />
      <CampoTexto form={form} nome="iptu" rotulo="IPTU (R$, opcional)" inputMode="decimal" registro={register("iptu", { setValueAs: numeroOuNulo })} />
      <CampoTexto form={form} nome="quartos" rotulo="Quartos" inputMode="numeric" registro={register("quartos", { valueAsNumber: true })} />
      <CampoTexto form={form} nome="suites" rotulo="Suítes (opcional)" inputMode="numeric" registro={register("suites", { setValueAs: numeroOuNulo })} />
      <CampoTexto form={form} nome="banheiros" rotulo="Banheiros" inputMode="numeric" registro={register("banheiros", { valueAsNumber: true })} />
      <CampoTexto form={form} nome="vagas" rotulo="Vagas de garagem" inputMode="numeric" registro={register("vagas", { valueAsNumber: true })} />

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
  );
}
