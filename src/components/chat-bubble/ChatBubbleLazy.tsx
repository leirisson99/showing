"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { abrirChat, EVENTO_ABRIR_CHAT, EVENTO_CHAT_PRONTO, type ModoChat } from "./eventos";
import type { ContextoMock } from "./mock-atendente";

// A bolha só é baixada depois da página: em tempo ocioso ou no primeiro clique em
// "Conversar"/"Agendar visita". Assim não pesa no carregamento nem no SEO.
const ChatBubble = dynamic(() => import("./ChatBubble"), { ssr: false });

type Props = { imovelId: string; corretor: string; imovel: ContextoMock["imovel"] };

export function ChatBubbleLazy(props: Props) {
  const [carregar, setCarregar] = useState(false);
  const pendente = useRef<ModoChat | null>(null);

  useEffect(() => {
    // O clique pode chegar antes de a bolha existir: guarda o pedido, carrega e,
    // quando a bolha avisar que está pronta, repete o pedido.
    const aoPedir = (e: Event) => {
      pendente.current = (e as CustomEvent<ModoChat>).detail ?? "conversa";
      setCarregar(true);
    };
    const aoFicarPronta = () => {
      const modo = pendente.current;
      pendente.current = null;
      if (modo) abrirChat(modo);
    };
    window.addEventListener(EVENTO_ABRIR_CHAT, aoPedir, { once: true });
    window.addEventListener(EVENTO_CHAT_PRONTO, aoFicarPronta);
    const espera = window.setTimeout(() => setCarregar(true), 1500);

    return () => {
      window.removeEventListener(EVENTO_ABRIR_CHAT, aoPedir);
      window.removeEventListener(EVENTO_CHAT_PRONTO, aoFicarPronta);
      window.clearTimeout(espera);
    };
  }, []);

  return carregar ? <ChatBubble {...props} /> : null;
}
