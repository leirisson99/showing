"use client";

import { limitar, suave, useSecao, useMovimentoReduzido } from "@/components/motion/use-secao";

const LISTA = [
  ["01", "Responde na hora, de madrugada também.", "O assistente usa só os dados que você cadastrou. Se não souber, ele não inventa: passa para você."],
  ["02", "Visita marcada sem ida e volta.", "O comprador escolhe um dos seus horários livres. Você recebe o pedido pronto e confirma com um toque."],
  ["03", "A página fica pronta com as fotos.", "Você envia as fotos e os dados. O texto sai com IA e você revisa antes de publicar."],
  ["04", "Você só entra quando vale a pena.", "Negociação, dúvida sem resposta ou pedido para falar com você chegam com o resumo da conversa."],
  ["05", "Você sabe o que está funcionando.", "Visualizações, conversas e visitas de cada imóvel, para mostrar resultado ao proprietário."],
] as const;

// [fundo, título, texto, número]
const CORES = [
  ["#ffffff", "#111816", "#5b6b68", "#0f3d3e"],
  ["#e6efee", "#111816", "#3e4d4a", "#0f3d3e"],
  ["#0f3d3e", "#ffffff", "#cfe0de", "#f2a65a"],
  ["#ffffff", "#111816", "#5b6b68", "#0f3d3e"],
  ["#111816", "#ffffff", "#c7d2ce", "#f2a65a"],
] as const;

// Benefícios: cartões que se empilham enquanto a seção fica na tela. Com movimento reduzido,
// viram uma lista simples.
export function Beneficios() {
  const reduzido = useMovimentoReduzido();
  const { ref, progresso: bp } = useSecao<HTMLElement>();
  const mover = !reduzido;
  const ativo = Math.min(LISTA.length - 1, Math.floor(bp * LISTA.length));

  return (
    <section ref={ref} id="beneficios" data-tom="claro" className={`relative bg-(--auth-claro) ${mover ? "h-[380svh]" : "py-20"}`}>
      <div className={mover ? "sticky top-0 flex h-svh items-center overflow-hidden" : ""}>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-[13px] font-medium tracking-[0.06em] text-(--auth-ink-muted) uppercase">O que muda no seu dia</span>
            <h2 className="font-[family-name:var(--font-display)] text-[34px] leading-[1.05] font-bold tracking-[-0.025em] sm:text-[40px] lg:text-5xl">
              Menos mensagem repetida. Mais visita marcada.
            </h2>
            {mover && (
              <div className="mt-2 flex gap-1.5" aria-hidden>
                {LISTA.map((_, i) => (
                  <span key={i} className="h-1 rounded-full transition-[width,background-color] duration-300" style={{ width: i === ativo ? 40 : 16, background: i <= ativo ? "#0f3d3e" : "#c5cfcc" }} />
                ))}
              </div>
            )}
          </div>
          <div className={`relative ${mover ? "h-[400px] sm:h-[440px]" : "flex flex-col gap-4"}`}>
            {LISTA.map((b, i) => {
              const c = CORES[i];
              const p = i === 0 ? 1 : limitar(bp * LISTA.length - i + 0.6);
              const acima = Math.max(0, Math.min(3, bp * LISTA.length - i - 0.4));
              return (
                <div
                  key={b[0]}
                  className={`box-border flex flex-col justify-between gap-6 rounded-[28px] border p-8 shadow-[0_24px_48px_-24px_rgba(17,24,22,.35)] sm:p-10 ${mover ? "absolute inset-0" : ""}`}
                  style={{
                    background: c[0],
                    color: c[1],
                    borderColor: c[0] === "#ffffff" ? "#e3e8e6" : c[0],
                    transformOrigin: "50% 0",
                    ...(mover ? { opacity: limitar(p * 1.5), transform: `translateY(${(1 - suave(p)) * 520 - acima * 18}px) scale(${1 - acima * 0.04})` } : {}),
                  }}
                >
                  <span className="font-[family-name:var(--font-display)] text-6xl leading-none font-bold tracking-[-0.04em] sm:text-[80px]" style={{ color: c[3] }}>
                    {b[0]}
                  </span>
                  <div className="flex flex-col gap-2.5">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl leading-[1.1] font-bold tracking-[-0.02em] sm:text-[30px]">{b[1]}</h3>
                    <p className="max-w-[40ch] text-base leading-relaxed sm:text-lg" style={{ color: c[2] }}>
                      {b[2]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
