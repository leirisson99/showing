"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { criarRascunhoAction } from "@/app/(painel)/painel/imoveis/actions";
import { etapaDadosSchema, type DadosImovel } from "@/lib/painel/schema";
import { VAZIO } from "./campos";
import { IndicadorEtapas } from "./IndicadorEtapas";
import { SecaoDados } from "./SecaoDados";

// Etapa 1 do cadastro. Ao salvar, o imóvel já existe como rascunho e o corretor segue para o
// editor (etapas 2 a 5), onde pode sair e voltar quando quiser.
export function NovoImovel() {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();

  // O formulário é do tipo completo (o editor usa o mesmo); aqui só os dados são validados.
  const form = useForm<DadosImovel>({
    resolver: zodResolver(etapaDadosSchema) as unknown as Resolver<DadosImovel>,
    defaultValues: VAZIO,
  });

  const salvar = form.handleSubmit((dados) => {
    iniciar(async () => {
      try {
        const r = await criarRascunhoAction(dados);
        if (!r.ok) return void toast.error(r.erro);
        toast.success("Rascunho criado");
        router.push(`/painel/imoveis/${r.id}?aba=caracteristicas`);
      } catch {
        toast.error("Não foi possível salvar. Tente de novo.");
      }
    });
  });

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-8">
      <IndicadorEtapas atual={0} />
      <section aria-labelledby="dados" className="flex flex-col gap-5 rounded-3xl bg-card p-6 ring-1 ring-foreground/10">
        <h2 id="dados" className="text-xl font-medium">Dados do imóvel</h2>
        <SecaoDados form={form} />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="h-11 rounded-full px-6 text-base" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar e continuar"}
        </Button>
        {Object.keys(form.formState.errors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">Corrija os campos destacados para continuar.</p>
        )}
      </div>
    </form>
  );
}
