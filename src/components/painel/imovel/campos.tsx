"use client";

import type { UseFormRegisterReturn, UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DadosImovel } from "@/lib/painel/schema";

// Valores iniciais de um cadastro novo. Os campos numéricos ficam vazios (undefined), não 0.
export const VAZIO = {
  tipo: undefined,
  finalidade: "venda",
  titulo: "",
  descricao: "",
  bairro: "",
  cidade: "Blumenau",
  endereco: null,
  mostrarEndereco: false,
  latitude: null,
  longitude: null,
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

// Campos opcionais: texto vazio vira null. O React Hook Form também aplica isto ao valor
// inicial, que pode ser null.
export const textoOuNulo = (v: string | null | undefined) => (v == null || v.trim() === "" ? null : v);
export const numeroOuNulo = (v: unknown) => (v === "" || v == null ? null : Number(v));

export type FormularioImovel = UseFormReturn<DadosImovel>;

type Props = {
  form: FormularioImovel;
  nome: keyof DadosImovel;
  rotulo: string;
  registro: UseFormRegisterReturn;
  dica?: string;
  type?: string;
  inputMode?: "numeric" | "decimal" | "text";
  placeholder?: string;
};

export function CampoTexto({ form, nome, rotulo, registro, dica, type, inputMode, placeholder }: Props) {
  const erro = form.formState.errors[nome] as { message?: string } | undefined;
  return (
    <Field data-invalid={!!erro}>
      <FieldLabel htmlFor={nome}>{rotulo}</FieldLabel>
      <Input id={nome} type={type} inputMode={inputMode} placeholder={placeholder} aria-invalid={!!erro} className="h-11" {...registro} />
      {dica && <FieldDescription>{dica}</FieldDescription>}
      <FieldError errors={[erro]} />
    </Field>
  );
}
