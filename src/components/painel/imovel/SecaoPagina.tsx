"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aprovarPaginaAction, editarPaginaAction, gerarPaginaAction, usarPaginaPadraoAction } from "@/app/(painel)/painel/imoveis/[id]/pagina-actions";
import { OBRIGATORIOS, type Capitulo, type Roteiro } from "@/lib/pagina/roteiro";
import type { RelatorioRoteiro } from "@/lib/pagina/tipos";

export type VersaoPagina = { versao: number; aprovado: boolean; conteudo: Roteiro; relatorio: RelatorioRoteiro };

type Props = { imovelId: string; fotosOk: boolean; rascunho: VersaoPagina | null; aprovada: VersaoPagina | null; iaLigada: boolean };

const NOME: Record<Capitulo["tipo"], string> = {
  hero_imagem: "Chegada (foto de capa e título)",
  numeros: "A casa em números",
  ambientes_fixo: "Ambientes (fotos que trocam ao rolar)",
  galeria_horizontal: "Galeria em linha",
  galeria_grade: "Galeria em grade",
  bairro: "O bairro",
  duvidas: "Dúvidas (perguntas para o assistente)",
  cta_visita: "Chamada para a visita",
};

const painel = "flex flex-col gap-3 rounded-2xl bg-muted/50 p-4";

// Aba "Página": o corretor gera a página em capítulos, revisa o texto, tira capítulos e aprova.
// Nada vai ao ar antes de "Usar esta página" (RN-06).
export function SecaoPagina({ imovelId, fotosOk, rascunho, aprovada, iaLigada }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [instrucao, setInstrucao] = useState("");
  const [roteiro, setRoteiro] = useState<Roteiro | null>(rascunho?.conteudo ?? null);
  const [alterado, setAlterado] = useState(false);
  const base = rascunho ?? aprovada;

  function atualizar<T>(f: (r: Roteiro) => T) {
    setRoteiro((r) => {
      if (!r) return r;
      const c = structuredClone(r);
      f(c);
      return c;
    });
    setAlterado(true);
  }

  function gerar(confirmar = false) {
    iniciar(async () => {
      try {
        const r = await gerarPaginaAction(imovelId, instrucao, confirmar);
        if (!r.ok) {
          if (r.precisaConfirmar && window.confirm(`${r.erro}\n\nGerar de novo mesmo assim?`)) return gerar(true);
          return void toast.error(r.erro);
        }
        toast.success("Página gerada. Revise o texto e use a pré-visualização.");
        setRoteiro(r.roteiro ?? null);
        setAlterado(false);
        setInstrucao("");
        router.refresh();
      } catch {
        toast.error("Não consegui montar a página. Tente de novo.");
      }
    });
  }

  function salvar(depois?: () => void) {
    if (!roteiro) return;
    iniciar(async () => {
      try {
        const r = await editarPaginaAction(imovelId, roteiro);
        if (!r.ok) return void toast.error(r.erro);
        toast.success("Edições salvas");
        setAlterado(false);
        router.refresh();
        depois?.();
      } catch {
        toast.error("Não foi possível salvar. Tente de novo.");
      }
    });
  }

  function aprovar() {
    iniciar(async () => {
      try {
        if (alterado && roteiro) {
          const e = await editarPaginaAction(imovelId, roteiro);
          if (!e.ok) return void toast.error(e.erro);
          setAlterado(false);
        }
        const r = await aprovarPaginaAction(imovelId);
        if (!r.ok) return void toast.error(r.erro);
        toast.success("Esta é a página que os compradores veem agora");
        router.refresh();
      } catch {
        toast.error("Não foi possível aprovar. Tente de novo.");
      }
    });
  }

  function voltarAoPadrao() {
    if (!window.confirm("Voltar para a página padrão? A página em capítulos fica guardada.")) return;
    iniciar(async () => {
      const r = await usarPaginaPadraoAction(imovelId);
      if (!r.ok) return void toast.error(r.erro);
      toast.success("Página padrão no ar");
      router.refresh();
    });
  }

  function mover(i: number, d: -1 | 1) {
    atualizar((r) => {
      const meio = r.capitulos.length - 2;
      const j = i + d;
      if (i < 1 || j < 1 || i >= meio || j >= meio) return;
      [r.capitulos[i], r.capitulos[j]] = [r.capitulos[j], r.capitulos[i]];
    });
  }

  const relatorio = base?.relatorio;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-muted-foreground">
        A página em capítulos conta o imóvel como uma visita: chegada, números, ambientes, fotos, bairro, dúvidas e convite para visitar. O texto sai da ficha que você
        cadastrou, sem inventar nada. Você revisa, edita e aprova antes de ir ao ar.
      </p>

      {aprovada && (
        <p role="status" className="rounded-2xl bg-ok-bg p-4 text-ok">
          No ar: página em capítulos, versão {aprovada.versao}.{" "}
          <button type="button" className="underline underline-offset-4" onClick={voltarAoPadrao} disabled={pendente}>
            Voltar para a página padrão
          </button>
        </p>
      )}

      {!fotosOk && <p className="rounded-2xl bg-aviso-bg p-4 text-aviso">Envie pelo menos 3 fotos (aba Fotos) para montar a página.</p>}

      <div className={painel}>
        <Label htmlFor="instrucao">{rascunho ? "Gerar de novo, com um pedido (opcional)" : "Pedido para o Diretor da Página (opcional)"}</Label>
        <div className="flex flex-wrap gap-3">
          <Input id="instrucao" value={instrucao} maxLength={200} onChange={(e) => setInstrucao(e.target.value)} placeholder='Ex.: "destaque o quintal"' className="min-w-60 flex-1" disabled={pendente} />
          <Button type="button" className="h-11 rounded-full px-6" onClick={() => gerar()} disabled={pendente || !fotosOk}>
            <Sparkles data-icon="inline-start" /> {pendente ? "Montando a página…" : rascunho ? "Gerar de novo" : "Gerar página"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {iaLigada ? "A IA monta os textos em cerca de um minuto." : "A IA não está configurada: a página sai com os textos padrão montados a partir da ficha."}
        </p>
      </div>

      {rascunho && roteiro && relatorio && (
        <>
          <section aria-labelledby="relatorio" className={painel}>
            <h3 id="relatorio" className="text-lg font-medium">Relatório da geração</h3>
            <p className="text-[15px]">
              Modelo <strong>{roteiro.template === "familia" ? "família" : "essencial"}</strong>: {roteiro.motivoTemplate}
            </p>
            <p className="text-sm text-muted-foreground">
              Versão {rascunho.versao} · {relatorio.origem === "ia" ? "texto escrito pela IA" : "texto padrão (sem IA)"} · {relatorio.camposUsados.length} campos da ficha usados
            </p>
            {roteiro.alertas.length > 0 ? (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px]">
                {roteiro.alertas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nada faltando na ficha.</p>
            )}
          </section>

          <section aria-labelledby="capitulos" className="flex flex-col gap-3">
            <h3 id="capitulos" className="text-lg font-medium">Capítulos</h3>
            {roteiro.capitulos.map((c, i) => {
              const obrigatorio = OBRIGATORIOS.includes(c.tipo);
              const meio = i >= 1 && i < roteiro.capitulos.length - 2;
              return (
                <div key={c.tipo} className={painel}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{i + 1}. {NOME[c.tipo]}</span>
                    <span className="flex gap-1">
                      {meio && (
                        <>
                          <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={`Subir ${NOME[c.tipo]}`} disabled={i <= 1 || pendente} onClick={() => mover(i, -1)}>
                            <ArrowUp />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={`Descer ${NOME[c.tipo]}`} disabled={i >= roteiro.capitulos.length - 3 || pendente} onClick={() => mover(i, 1)}>
                            <ArrowDown />
                          </Button>
                        </>
                      )}
                      {!obrigatorio && roteiro.capitulos.length > 5 && (
                        <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={`Tirar ${NOME[c.tipo]}`} disabled={pendente} onClick={() => atualizar((r) => void r.capitulos.splice(i, 1))}>
                          <Trash2 />
                        </Button>
                      )}
                    </span>
                  </div>
                  <CamposDoCapitulo capitulo={c} editar={(f) => atualizar((r) => f(r.capitulos[i]))} desligado={pendente} />
                </div>
              );
            })}
          </section>

          <section aria-labelledby="seo" className={painel}>
            <h3 id="seo" className="text-lg font-medium">Título e descrição no Google</h3>
            <Campo rotulo={`Título (${roteiro.seo.title.length}/60)`} valor={roteiro.seo.title} max={60} onChange={(v) => atualizar((r) => void (r.seo.title = v))} desligado={pendente} />
            <Campo rotulo={`Descrição (${roteiro.seo.description.length}/155)`} valor={roteiro.seo.description} max={155} onChange={(v) => atualizar((r) => void (r.seo.description = v))} desligado={pendente} />
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button type="button" variant="outline" className="h-11 rounded-full px-6" disabled={pendente || !alterado} onClick={() => salvar()}>
              Salvar edições
            </Button>
            <Link href={`/painel/imoveis/${imovelId}/previa`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-full border px-6 text-sm font-medium hover:bg-muted">
              <Eye className="size-4" aria-hidden /> Ver pré-visualização
            </Link>
            <Button type="button" className="h-11 rounded-full px-6" disabled={pendente} onClick={aprovar}>
              Usar esta página
            </Button>
            {alterado && <span className="text-sm text-muted-foreground">Há edições não salvas.</span>}
          </div>
        </>
      )}
    </div>
  );
}

function Campo({ rotulo, valor, onChange, max, desligado }: { rotulo: string; valor: string; onChange: (v: string) => void; max: number; desligado: boolean }) {
  const id = `c-${rotulo.replace(/\W+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input id={id} value={valor} maxLength={max} onChange={(e) => onChange(e.target.value)} disabled={desligado} />
    </div>
  );
}

function CamposDoCapitulo({ capitulo: c, editar, desligado }: { capitulo: Capitulo; editar: (f: (c: Capitulo) => void) => void; desligado: boolean }) {
  switch (c.tipo) {
    case "ambientes_fixo":
      return (
        <div className="flex flex-col gap-3">
          {c.quadros.map((q, i) => (
            <div key={q.foto} className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <Campo rotulo={`Ambiente ${i + 1}: nome`} valor={q.rotulo} max={24} desligado={desligado} onChange={(v) => editar((x) => x.tipo === "ambientes_fixo" && void (x.quadros[i].rotulo = v))} />
              <Campo rotulo={`Ambiente ${i + 1}: frase`} valor={q.frase.texto} max={140} desligado={desligado} onChange={(v) => editar((x) => x.tipo === "ambientes_fixo" && void (x.quadros[i].frase.texto = v))} />
            </div>
          ))}
        </div>
      );
    case "numeros":
      return (
        <>
          <Campo rotulo="Título" valor={c.titulo.texto} max={140} desligado={desligado} onChange={(v) => editar((x) => x.tipo === "numeros" && void (x.titulo.texto = v))} />
          <p className="text-sm text-muted-foreground">Números: {c.itens.map((i) => i.rotulo).join(", ")} (vêm da ficha).</p>
        </>
      );
    case "duvidas":
      return (
        <>
          <Campo rotulo="Título" valor={c.titulo.texto} max={140} desligado={desligado} onChange={(v) => editar((x) => x.tipo === "duvidas" && void (x.titulo.texto = v))} />
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {c.perguntas.map((p) => (
              <li key={p.rotulo}>{p.pergunta}</li>
            ))}
          </ul>
        </>
      );
    default:
      return <Campo rotulo="Título" valor={c.titulo.texto} max={140} desligado={desligado} onChange={(v) => editar((x) => "titulo" in x && void (x.titulo.texto = v))} />;
  }
}
