"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { salvarImovel } from "@/app/(painel)/painel/imoveis/actions";
import { imovelSchema, type DadosImovel } from "@/lib/painel/schema";
import type { Metricas } from "@/lib/painel/metricas";
import type { StatusImovel } from "@/lib/painel/tipos";
import { AcoesImovel } from "../AcoesImovel";
import { BadgeStatus } from "../BadgeStatus";
import { PublicacaoImovel } from "../PublicacaoImovel";
import { UploadFotos, type FotoItem } from "../UploadFotos";
import { DesempenhoImovel, type ConversaResumida, type VisitaResumida } from "./DesempenhoImovel";
import { IndicadorEtapas } from "./IndicadorEtapas";
import { RevisaoImovel } from "./RevisaoImovel";
import { SecaoCaracteristicas } from "./SecaoCaracteristicas";
import { SecaoDados } from "./SecaoDados";
import { SecaoPagina, type VersaoPagina } from "./SecaoPagina";
import { SecaoTexto } from "./SecaoTexto";

export type Aba = "dados" | "caracteristicas" | "fotos" | "texto" | "revisao" | "pagina" | "desempenho";

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: "dados", rotulo: "Dados" },
  { valor: "caracteristicas", rotulo: "Características" },
  { valor: "fotos", rotulo: "Fotos" },
  { valor: "texto", rotulo: "Texto" },
  { valor: "revisao", rotulo: "Revisão" },
  { valor: "pagina", rotulo: "Página" },
  { valor: "desempenho", rotulo: "Desempenho" },
];

// Campos do formulário em cada aba, para apontar onde está o erro.
const CAMPOS: Partial<Record<Aba, (keyof DadosImovel)[]>> = {
  dados: ["tipo", "finalidade", "bairro", "cidade", "endereco", "mostrarEndereco", "latitude", "longitude", "preco", "condominio", "iptu", "quartos", "suites", "banheiros", "vagas", "areaM2", "aceitaFinanciamento", "aceitaFgts"],
  caracteristicas: ["caracteristicas", "infoAdicional"],
  texto: ["titulo", "descricao"],
};

// Abas com formulário e a próxima etapa do cadastro.
const PROXIMA: Partial<Record<Aba, Aba>> = { dados: "caracteristicas", caracteristicas: "fotos", texto: "revisao" };

const abaComErro = (erros: FieldErrors<DadosImovel>): Aba | null =>
  (Object.keys(CAMPOS) as Aba[]).find((aba) => CAMPOS[aba]!.some((c) => erros[c])) ?? null;

type Props = {
  imovel: { id: string; titulo: string; slug: string; status: StatusImovel; urlPublica: string };
  valores: DadosImovel;
  fotos: FotoItem[];
  falta: string[];
  perfilOk: boolean;
  metricas: Metricas;
  conversas: ConversaResumida[];
  visitas: VisitaResumida[];
  abaInicial: Aba;
  pagina: { rascunho: VersaoPagina | null; aprovada: VersaoPagina | null; iaLigada: boolean };
};

// Editor do imóvel em abas (pages.md §3.9). Enquanto é rascunho, as cinco primeiras abas são
// as etapas do cadastro; depois de publicado aparece também o Desempenho.
export function EditorImovel({ imovel, valores, fotos, falta, perfilOk, metricas, conversas, visitas, abaInicial, pagina }: Props) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [salvando, iniciar] = useTransition();
  const rascunho = imovel.status === "rascunho";

  const form = useForm<DadosImovel>({ resolver: zodResolver(imovelSchema), defaultValues: valores });
  const { errors, isDirty } = form.formState;

  const abasVisiveis = ABAS.filter((a) => a.valor !== "desempenho" || !rascunho);
  const etapa = abasVisiveis.findIndex((a) => a.valor === aba);

  function salvarEIr(depois?: Aba) {
    return form.handleSubmit(
      (dados) => {
        iniciar(async () => {
          try {
            const r = await salvarImovel(imovel.id, dados);
            if (!r.ok) return void toast.error(r.erro);
            toast.success("Imóvel salvo");
            form.reset(dados);
            if (depois) setAba(depois);
            router.refresh();
          } catch {
            toast.error("Não foi possível salvar. Tente de novo.");
          }
        });
      },
      (erros) => {
        const onde = abaComErro(erros);
        if (onde) setAba(onde);
        toast.error("Corrija os campos destacados para salvar.");
      },
    )();
  }

  const botoes = (daAba: Aba) => (
    <div className="flex flex-wrap items-center gap-3 border-t pt-5">
      <Button type="submit" variant={rascunho && PROXIMA[daAba] ? "outline" : "default"} className="h-11 rounded-full px-6" disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
      {rascunho && PROXIMA[daAba] && (
        <Button type="button" className="h-11 rounded-full px-6" disabled={salvando} onClick={() => void salvarEIr(PROXIMA[daAba])}>
          Salvar e continuar
        </Button>
      )}
      {isDirty && <span className="text-sm text-muted-foreground">Há alterações não salvas.</span>}
    </div>
  );

  const painel = "flex flex-col gap-5 rounded-3xl bg-card p-6 ring-1 ring-foreground/10";

  return (
    <div className="flex flex-col gap-6">
      {rascunho ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BadgeStatus status="rascunho" />
          <AcoesImovel id={imovel.id} titulo={imovel.titulo} slug={imovel.slug} status="rascunho" urlPublica={imovel.urlPublica} />
        </div>
      ) : (
        <PublicacaoImovel id={imovel.id} titulo={imovel.titulo} slug={imovel.slug} status={imovel.status} falta={falta} urlPublica={imovel.urlPublica} />
      )}

      {rascunho && etapa >= 0 && etapa < 5 && <IndicadorEtapas atual={etapa} />}

      <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)} className="gap-5">
        <TabsList
          aria-label="Seções do imóvel"
          className="group-data-horizontal/tabs:h-11 w-full max-w-full justify-start gap-1 overflow-x-auto rounded-full bg-secondary p-1"
        >
          {abasVisiveis.map((a) => {
            const comErro = CAMPOS[a.valor]?.some((c) => errors[c]);
            return (
              <TabsTrigger key={a.valor} value={a.valor} className="h-9 flex-none rounded-full px-4">
                {a.rotulo}
                {comErro && <span className="ml-1.5 size-2 rounded-full bg-destructive" role="img" aria-label="com erro" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* As abas com campos formam um só formulário: um Salvar vale para todas. */}
        <form onSubmit={(e) => { e.preventDefault(); void salvarEIr(); }} noValidate>
          <TabsContent value="dados" className={painel}>
            <h2 className="text-xl font-medium">Dados do imóvel</h2>
            <SecaoDados form={form} />
            {botoes("dados")}
          </TabsContent>
          <TabsContent value="caracteristicas" className={painel}>
            <h2 className="text-xl font-medium">Características</h2>
            <SecaoCaracteristicas form={form} />
            {botoes("caracteristicas")}
          </TabsContent>
          <TabsContent value="texto" className={painel}>
            <h2 className="text-xl font-medium">Título e descrição</h2>
            <SecaoTexto form={form} />
            {botoes("texto")}
          </TabsContent>
        </form>

        <TabsContent value="fotos" className={painel}>
          <h2 className="text-xl font-medium">Fotos</h2>
          <UploadFotos imovelId={imovel.id} fotos={fotos} />
          {rascunho && (
            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="button" className="h-11 rounded-full px-6" onClick={() => setAba("texto")}>
                Continuar para o texto
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="revisao" className={painel}>
          <h2 className="text-xl font-medium">Revisão</h2>
          <RevisaoImovel id={imovel.id} valores={form.getValues()} falta={falta} perfilOk={perfilOk} rascunho={rascunho} irParaAba={setAba} />
        </TabsContent>

        <TabsContent value="pagina" className={painel}>
          <h2 className="text-xl font-medium">Página em capítulos</h2>
          <SecaoPagina imovelId={imovel.id} fotosOk={fotos.length >= 3} rascunho={pagina.rascunho} aprovada={pagina.aprovada} iaLigada={pagina.iaLigada} />
        </TabsContent>

        {!rascunho && (
          <TabsContent value="desempenho" className={painel}>
            <h2 className="text-xl font-medium">Desempenho</h2>
            <DesempenhoImovel metricas={metricas} conversas={conversas} visitas={visitas} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
