"use client";

import { MessageCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abrirChat, type ModoChat } from "@/components/chat-bubble/eventos";
import { cn } from "@/lib/utils";

type Props = {
  modo: ModoChat;
  variante?: "accent" | "outline" | "default" | "contorno";
  className?: string;
  children: React.ReactNode;
};

// "accent" é a chamada principal da página (âmbar); no máximo uma visível por vez.
export function BotaoChat({ modo, variante = "default", className, children }: Props) {
  const Icone = modo === "agendamento" ? CalendarCheck : MessageCircle;
  return (
    <Button
      type="button"
      variant={variante === "accent" ? "default" : variante === "contorno" ? "outline" : variante}
      onClick={() => abrirChat(modo)}
      className={cn(
        "h-11 rounded-full px-6 text-sm font-semibold",
        variante === "accent" && "bg-cta text-cta-foreground hover:bg-cta/90",
        variante === "contorno" && "border-white/50 bg-transparent text-white hover:bg-white hover:text-foreground",
        className,
      )}
    >
      <Icone data-icon="inline-start" />
      {children}
    </Button>
  );
}
