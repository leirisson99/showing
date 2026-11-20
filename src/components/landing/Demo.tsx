"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { LogoMarca } from "@/components/brand/Logo";
import { suave, useSecao, useMovimentoReduzido } from "./use-secao";

type Fase = "inicio" | "meio" | "horarios" | "pedida";
type Fala = { de: "c" | "a"; t: string };
type ItemPainel = { tipo: "r" | "v"; titulo: string; detalhe: string };

const SAUDACAO = "Oi! Sou o assistente do corretor. Posso tirar dúvidas sobre este imóvel ou marcar uma visita.";
const HORARIOS = ["Sábado · 10h", "Sábado · 15h", "Domingo · 10h"];

// "Seja o comprador por um minuto": conversa de exemplo, toda no navegador. As respostas são
// roteirizadas com dados de um imóvel fictício; nada é enviado a lugar nenhum.
export function Demo() {
  const reduzido = useMovimentoReduzido();
  const { ref, entrada } = useSecao<HTMLElement>();
  const ep = reduzido ? 1 : entrada;
  const [falas, setFalas] = useState<Fala[]>([]);
  const [digitando, setDigitando] = useState(false);
  const [fase, setFase] = useState<Fase>("inicio");
  const [horario, setHorario] = useState("");
  const [painel, setPainel] = useState<ItemPainel[]>([]);
  const [turno, setTurno] = useState<{ resposta: string; aoFim: () => void } | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  // A resposta do assistente chega 1 s depois da pergunta. Recomeçar (ou sair da página) cancela.
  useEffect(() => {
    if (!turno) return;
    const id = setTimeout(() => {
      setFalas((f) => [...f, { de: "a", t: turno.resposta }]);
      setDigitando(false);
      turno.aoFim();
      setTurno(null);
    }, 1000);
    return () => clearTimeout(id);
  }, [turno]);
  // Só rola dentro da caixa de mensagens, nunca a página.
  useEffect(() => {
    const caixa = fim.current?.parentElement;
    if (caixa) caixa.scrollTop = caixa.scrollHeight;
  }, [falas, digitando]);

  function responder(pergunta: string, resposta: string, aoFim: () => void) {
    setFalas((f) => [...f, { de: "c", t: pergunta }]);
    setDigitando(true);
    setTurno({ resposta, aoFim });
  }

  function recomecar() {
    setTurno(null);
    setFalas([]);
    setDigitando(false);
    setFase("inicio");
    setHorario("");
    setPainel([]);
  }

  const jaPerguntou = (t: string) => falas.some((f) => f.t === t);
  const opcoes: { t: string; acao: () => void; pri?: boolean }[] = [];
  if (fase === "inicio" || fase === "meio") {
    if (!jaPerguntou("Aceita financiamento?"))
      opcoes.push({
        t: "Aceita financiamento?",
        acao: () =>
          responder("Aceita financiamento?", "Aceita, sim: financiamento bancário e FGTS. Quer ver os horários para visitar?", () => {
            setFase("meio");
            setPainel((p) => [...p, { tipo: "r", titulo: "Dúvida respondida sozinha", detalhe: "Financiamento · você não precisou parar" }]);
          }),
      });
    if (!jaPerguntou("Tem vaga de garagem?"))
      opcoes.push({
        t: "Tem vaga de garagem?",
        acao: () =>
          responder("Tem vaga de garagem?", "Tem 1 vaga coberta. Posso ajudar com mais alguma coisa?", () => {
            setFase("meio");
            setPainel((p) => [...p, { tipo: "r", titulo: "Dúvida respondida sozinha", detalhe: "Garagem · resposta tirada da ficha" }]);
          }),
      });
    opcoes.push({ t: "Quero agendar uma visita", pri: true, acao: () => responder("Quero agendar uma visita", "Ótimo! Estes são os horários livres do corretor:", () => setFase("horarios")) });
  } else if (fase === "horarios") {
    for (const h of HORARIOS) {
      opcoes.push({
        t: h,
        acao: () =>
          responder(h, "Pronto! Pedi sua visita. O corretor vai confirmar com você.", () => {
            setFase("pedida");
            setHorario(h);
            setPainel((p) => [...p, { tipo: "v", titulo: "Nova visita pedida", detalhe: `${h} · com nome, telefone e forma de pagamento` }]);
          }),
      });
    }
  }

  const todas: Fala[] = [{ de: "a", t: SAUDACAO }, ...falas];

  return (
    <section ref={ref} id="experimente" data-tom="claro" className="bg-white py-16">
      <div
        className="mx-auto flex max-w-6xl flex-col gap-9 px-6"
        style={{ opacity: ep, transform: `translateY(${reduzido ? 0 : (1 - suave(ep)) * 50}px)` }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-[13px] font-medium tracking-[0.06em] text-(--auth-ink-muted) uppercase">Experimente</span>
          <h2 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.08] font-bold tracking-[-0.02em] lg:text-[44px]">Seja o comprador por um minuto.</h2>
          <p className="text-(--auth-ink-muted)">Toque nas perguntas e veja o que acontece dos dois lados.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex h-140 flex-col overflow-hidden rounded-[28px] border border-(--auth-line)">
            <div className="flex items-center justify-between bg-(--auth-primary) px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-(--auth-primary-deep)">
                  <LogoMarca className="size-5" />
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold">Assistente do corretor</span>
                  <span className="text-[13px] text-(--auth-on-primary-muted)">Página do imóvel · visão do comprador</span>
                </div>
              </div>
              <button
                type="button"
                onClick={recomecar}
                className="min-h-11 rounded-full border border-white/40 px-3 text-[13px] font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)"
              >
                Recomeçar
              </button>
            </div>
            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5">
              {todas.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3.5 py-2.5 ${m.de === "c" ? "self-end rounded-[20px] rounded-br-sm bg-(--auth-primary) text-white" : "self-start rounded-[20px] rounded-bl-sm bg-(--auth-muted)"}`}
                >
                  {m.t}
                </div>
              ))}
              {digitando && (
                <div className="flex gap-1 self-start rounded-[20px] rounded-bl-sm bg-(--auth-muted) px-3.5 py-3" aria-label="O assistente está digitando">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="lp-pisca size-[7px] rounded-full bg-(--auth-ink-muted)" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              )}
              {fase === "pedida" && (
                <div className="flex items-center gap-2.5 self-stretch rounded-xl border border-(--auth-line) px-4 py-3.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-(--auth-success-bg) text-(--auth-success-ink)">
                    <Check className="size-4" aria-hidden />
                  </span>
                  <div className="flex flex-col leading-snug">
                    <span className="font-semibold">Visita pedida · {horario}</span>
                    <span className="text-sm text-(--auth-ink-muted)">O corretor vai confirmar com você.</span>
                  </div>
                </div>
              )}
              <div ref={fim} />
            </div>
            <div className="flex min-h-[52px] flex-wrap gap-2 border-t border-(--auth-line) px-5 pt-3.5 pb-5">
              {opcoes.map((o) => (
                <button
                  key={o.t}
                  type="button"
                  disabled={digitando}
                  onClick={o.acao}
                  className={`min-h-11 rounded-full border border-(--auth-primary) px-3.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent) disabled:opacity-50 ${o.pri ? "bg-(--auth-primary) text-white" : "bg-white text-(--auth-primary)"}`}
                >
                  {o.t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5 rounded-[28px] bg-(--auth-claro) p-6">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold">O que chega para você</span>
              <span className="text-[13px] text-(--auth-ink-muted)">Painel do corretor</span>
            </div>
            {painel.length === 0 && (
              <div className="flex min-h-40 grow items-center justify-center rounded-2xl border border-dashed border-[#c5cfcc] p-6 text-center text-[15px] text-(--auth-ink-muted)">
                Nada por aqui ainda. Você pode continuar o que estava fazendo.
              </div>
            )}
            {painel.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 ${p.tipo === "v" ? "border-(--auth-primary)" : "border-(--auth-line)"}`}>
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] font-bold ${p.tipo === "v" ? "bg-(--auth-primary) text-white" : "bg-(--auth-success-bg) text-(--auth-success-ink)"}`}>
                  {p.tipo === "v" ? "V" : "R"}
                </span>
                <div className="flex min-w-0 flex-col leading-snug">
                  <span className="text-[15px] font-semibold">{p.titulo}</span>
                  <span className="text-sm text-(--auth-ink-muted)">{p.detalhe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
