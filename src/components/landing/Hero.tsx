"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, MessageCircle, ArrowDown } from "lucide-react";
import { LogoMarca } from "@/components/brand/Logo";
import { limitar, useRolagem, useMovimentoReduzido } from "./use-secao";

const CONVERSAS = [
  { hora: "Hoje, 23:12", frase: "dormindo.", c: "Esse apartamento aceita financiamento?", a: "Aceita, sim: financiamento e FGTS. Quer visitar? Tenho horários amanhã.", fim: "horarios", nt: "Nova visita pedida", nd: "Enquanto você dormia" },
  { hora: "Hoje, 07:05", frase: "dirigindo.", c: "Qual o valor do condomínio?", a: "O condomínio é R$ 520 por mês, segundo a ficha. Quer saber mais alguma coisa?", fim: "resposta", nt: "Dúvida respondida", nd: "Sem você tirar a mão do volante" },
  { hora: "Hoje, 14:37", frase: "em outra visita.", c: "Dá para negociar o valor?", a: "Essa parte é com o corretor. Já avisei e ele fala com você em breve.", fim: "transferida", nt: "Conversa transferida", nd: "Negociação, com o resumo pronto" },
] as const;

const PALAVRAS = "Seu imóvel atende sozinho enquanto você está".split(" ");

const CHIPS = [
  { t: "Online agora", x: -96, y: 470, d: 0, ponto: true },
  { t: "Só responde com a ficha do imóvel", x: -150, y: 200, d: 900, ponto: false },
  { t: "Seus horários, sua agenda", x: 250, y: 560, d: 1800, ponto: false },
];

// Primeira dobra: título que se escreve, frase que troca com a conversa de exemplo, celular com o
// assistente atendendo e notificação de visita. Conversas, nomes e valores são ilustrativos.
export function Hero() {
  const reduzido = useMovimentoReduzido();
  const { y, vh } = useRolagem();
  const [carregado, setCarregado] = useState(false);
  const [ciclo, setCiclo] = useState(0);
  const [passo, setPasso] = useState(0);
  const [mouse, setMouse] = useState({ mx: 0, my: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setCarregado(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduzido) return;
    const id = setInterval(() => {
      setPasso((p) => {
        if (p >= 12) {
          setCiclo((c) => (c + 1) % 3);
          return 0;
        }
        return p + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [reduzido]);

  const mover = !reduzido;
  const ps = reduzido ? 6 : passo;
  const cv = CONVERSAS[ciclo];
  const hp = limitar(y / vh);
  const { mx, my } = mover ? mouse : { mx: 0, my: 0 };
  const saindo = mover && ps >= 12;
  const T = (px: number) => (mover ? px : 0);
  const aparece = (on: boolean) => ({ opacity: on ? 1 : 0, transform: on ? "none" : `translateY(${T(10)}px)`, transition: "opacity .5s, transform .5s" });

  function aoMover(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const novo = { mx: ((e.clientX - r.left) / r.width) * 2 - 1, my: ((e.clientY - r.top) / r.height) * 2 - 1 };
    if (raf.current === null) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        setMouse(novo);
      });
    }
  }

  return (
    <section
      id="inicio"
      data-tom="claro"
      onMouseMove={aoMover}
      onMouseLeave={() => setMouse({ mx: 0, my: 0 })}
      className="relative flex min-h-svh items-center overflow-hidden bg-white pt-24 pb-20"
    >
      <div
        aria-hidden
        className={`absolute -right-30 top-20 size-[560px] rounded-full bg-(--auth-primary-soft) ${mover ? "lp-deriva" : ""}`}
        style={{ transform: `translate(${mx * -20}px, ${my * -14}px)` }}
      />
      <div
        aria-hidden
        className={`absolute right-[30%] bottom-15 hidden size-[220px] rounded-full bg-(--auth-fundo-quente) lg:block ${mover ? "lp-deriva" : ""}`}
        style={{ transform: `translate(${mx * 26}px, ${my * 18}px)`, animationDirection: "alternate-reverse", animationDuration: "11s" }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-5" style={{ opacity: 1 - limitar(hp * 1.4), transform: `translateY(${T(-hp * 80)}px)` }}>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-(--auth-primary-soft) px-3 py-1.5 text-[13px] font-medium text-(--auth-primary)">
            <span className={`size-2 rounded-full bg-(--auth-success-ink) ${mover ? "lp-pulsa" : ""}`} />
            Piloto aberto para corretores
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-[40px] leading-[1.04] font-bold tracking-[-0.03em] sm:text-[52px] lg:text-[60px]">
            {PALAVRAS.map((t, i) => (
              <span
                key={t}
                className={`inline-block ${t === "sozinho" ? "text-(--auth-primary)" : ""}`}
                style={{
                  opacity: carregado ? 1 : 0,
                  transform: carregado ? "none" : `translateY(${T(24)}px)`,
                  transition: `opacity .7s ease ${i * 70}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${i * 70}ms`,
                }}
              >
                {t}&nbsp;
              </span>
            ))}
            <span className="relative block h-[1.1em] overflow-hidden text-(--auth-primary)" style={{ opacity: carregado ? 1 : 0, transition: "opacity .7s ease .5s" }}>
              {CONVERSAS.map((c, i) => {
                const ant = (ciclo + 2) % 3;
                const pos = i === ciclo ? 0 : i === ant ? -100 : 100;
                return (
                  <span
                    key={c.frase}
                    aria-hidden={i === ciclo ? undefined : true}
                    className="absolute top-0 left-0 whitespace-nowrap"
                    style={{ transform: `translateY(${mover ? pos : 0}%)`, opacity: i === (mover ? ciclo : 0) ? 1 : 0, transition: "transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s" }}
                  >
                    {c.frase}
                  </span>
                );
              })}
            </span>
          </h1>
          <p className="max-w-[46ch] text-lg leading-relaxed text-(--auth-ink-muted) lg:text-xl">
            O Showing transforma as fotos do imóvel numa página com um assistente que responde compradores na hora e marca visitas na sua agenda.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="#piloto"
              className="inline-flex h-13 items-center rounded-full bg-(--auth-primary) px-6 font-semibold text-white hover:bg-(--auth-primary-deep) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)"
            >
              Quero entrar no piloto
            </Link>
            <Link
              href="#experimente"
              className="inline-flex h-13 items-center gap-2 rounded-full border border-(--auth-line-strong) bg-white px-5.5 font-medium text-(--auth-primary) hover:bg-(--auth-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)"
            >
              <MessageCircle className="size-[18px]" aria-hidden /> Testar o assistente
            </Link>
          </div>
        </div>

        <div className="relative flex justify-center" style={{ perspective: "1200px" }} aria-hidden>
          <div
            style={{
              transformStyle: "preserve-3d",
              transition: "transform .25s ease-out",
              transform: `translateY(${T(hp * -60)}px) rotateY(${mx * 8}deg) rotateX(${my * -6}deg) rotate(${mover ? -3 + hp * 3 : 0}deg)`,
              opacity: 1 - limitar(hp * 1.2 - 0.2),
            }}
          >
            <div className={mover ? "lp-flutua" : ""}>
              <div className="h-[620px] w-[320px] rounded-[44px] bg-(--auth-escuro) p-2.5 shadow-[0_40px_80px_-30px_rgba(17,24,22,.45)] max-sm:h-[560px] max-sm:w-[288px]">
                <div className="flex size-full flex-col overflow-hidden rounded-[34px] bg-white">
                  <div className="flex items-center gap-2.5 bg-(--auth-primary) px-4 pt-5.5 pb-3.5 text-white">
                    <span className="relative inline-flex">
                      <span className="flex size-[34px] items-center justify-center rounded-full border-2 border-white bg-(--auth-primary-deep)">
                        <LogoMarca className="size-5" />
                      </span>
                      <span className={`absolute -right-px -bottom-px size-2.5 rounded-full border-2 border-(--auth-primary) bg-[#3fbf7f] ${mover ? "lp-pulsa" : ""}`} />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold">Assistente do corretor</span>
                      <span className="text-xs text-(--auth-on-primary-muted)">Online agora</span>
                    </div>
                  </div>
                  <div className="flex grow flex-col gap-2.5 p-3.5 text-sm transition-opacity duration-500" style={{ opacity: saindo ? 0 : 1 }}>
                    <span className="self-center text-[11px] text-(--auth-ink-muted)">{cv.hora}</span>
                    <div className="max-w-[82%] self-end rounded-2xl rounded-br-sm bg-(--auth-primary) px-3 py-2 text-white" style={aparece(ps >= 1)}>
                      {cv.c}
                    </div>
                    <div className="gap-1 self-start rounded-2xl rounded-bl-sm bg-(--auth-muted) px-3 py-2.5" style={{ display: ps === 2 || ps === 3 ? "flex" : "none" }}>
                      {[0, 150, 300].map((d) => (
                        <span key={d} className={`size-1.5 rounded-full bg-(--auth-ink-muted) ${mover ? "lp-pisca" : ""}`} style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <div className="max-w-[86%] self-start rounded-2xl rounded-bl-sm bg-(--auth-muted) px-3 py-2" style={aparece(ps >= 4)}>
                      {cv.a}
                    </div>
                    <div className="flex flex-wrap gap-1.5" style={aparece(ps >= 5)}>
                      {cv.fim === "horarios" && (
                        <>
                          <span className="rounded-full border border-(--auth-primary) px-2.5 py-1.5 text-xs text-(--auth-primary)">Sábado · 10h</span>
                          <span className="rounded-full border border-(--auth-primary) bg-(--auth-primary) px-2.5 py-1.5 text-xs text-white">Sábado · 15h</span>
                        </>
                      )}
                      {cv.fim === "resposta" && <span className="rounded-full bg-(--auth-success-bg) px-2.5 py-1 text-xs text-(--auth-success-ink)">Respondido com a ficha do imóvel</span>}
                      {cv.fim === "transferida" && <span className="rounded-full bg-[#fff4e0] px-2.5 py-1 text-xs text-[#7a4a00]">Transferida para o corretor</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {CHIPS.map((c, i) => (
              <div
                key={c.t}
                className={`absolute hidden items-center gap-2 rounded-full border border-(--auth-line) bg-white px-3.5 py-2 text-[13px] font-medium whitespace-nowrap shadow-[0_10px_24px_-12px_rgba(17,24,22,.25)] lg:inline-flex ${mover ? "lp-flutua" : ""}`}
                style={{
                  left: `calc(50% + ${c.x}px)`,
                  top: c.y,
                  opacity: carregado ? 1 - limitar(hp * 1.6) : 0,
                  transition: `opacity .7s ease ${600 + i * 250}ms`,
                  transform: `translate(${mx * (10 + i * 6)}px, ${my * (8 + i * 4) + T(-hp * (40 + i * 30))}px)`,
                  animationDuration: `${3.2 + i * 0.7}s`,
                  animationDelay: `${c.d}ms`,
                }}
              >
                {c.ponto && <span className={`size-2 rounded-full bg-(--auth-success-ink) ${mover ? "lp-pulsa" : ""}`} />}
                {c.t}
              </div>
            ))}
            <div
              className="absolute top-24 -right-6 flex items-center gap-3 rounded-2xl border border-(--auth-line) bg-white px-4 py-3 shadow-[0_12px_32px_-8px_rgba(17,24,22,.18)] max-sm:right-0"
              style={{
                transition: "opacity .5s, transform .5s cubic-bezier(.2,.7,.2,1)",
                ...(ps >= 6 && !saindo ? { opacity: 1, transform: `translate(${mx * -16}px, ${my * -10}px)` } : { opacity: 0, transform: `translateX(${T(30)}px)` }),
              }}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-(--auth-primary) text-white">
                <CalendarDays className="size-[18px]" />
              </span>
              <div className="flex flex-col leading-snug">
                <span className="text-sm font-semibold">{cv.nt}</span>
                <span className="text-[13px] text-(--auth-ink-muted)">{cv.nd}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-7 hidden flex-col items-center gap-1.5 text-[13px] text-(--auth-ink-muted) sm:flex"
        style={{ opacity: limitar(1 - hp * 5) }}
        aria-hidden
      >
        Role para ver a diferença
        <ArrowDown className="size-[18px]" />
      </div>
    </section>
  );
}
