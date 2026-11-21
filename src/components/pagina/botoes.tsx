"use client";

import { abrirChat } from "@/components/chat-bubble/eventos";
import { cn } from "@/lib/utils";

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-accent)";

/** "Agendar visita": abre o chat já no agendamento. */
export function BotaoAgendar({ className, children = "Agendar visita" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => abrirChat("agendamento")}
      className={cn("inline-flex h-12 items-center justify-center rounded-full bg-(--auth-accent) px-6 font-semibold text-[#3a2205] hover:brightness-95", foco, className)}
    >
      {children}
    </button>
  );
}

/** Abre o chat; com `mensagem`, já faz a pergunta. */
export function BotaoConversar({ className, children, mensagem }: { className?: string; children: React.ReactNode; mensagem?: string }) {
  return (
    <button type="button" onClick={() => abrirChat("conversa", mensagem)} className={cn("inline-flex h-12 items-center justify-center rounded-full px-5 font-medium", foco, className)}>
      {children}
    </button>
  );
}
