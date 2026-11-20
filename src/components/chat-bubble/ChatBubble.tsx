"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { registrarEventoUmaVez } from "@/lib/eventos-cliente";
import { cn } from "@/lib/utils";
import { CartaoVisita } from "./CartaoVisita";
import { EVENTO_ABRIR_CHAT, EVENTO_CHAT_PRONTO, type ModoChat } from "./eventos";
import type { ContextoMock } from "./mock-atendente";
import { useConversa } from "./use-conversa";

type Props = {
  imovelId: string;
  tituloImovel: string;
  corretor: string;
  imovel: ContextoMock["imovel"];
  /** Só dígitos, com DDI. Mostrado quando a conversa chega ao limite de mensagens. */
  whatsapp?: string | null;
  fotoSrc?: string | null;
  semMetricas?: boolean;
};

const CHAVE_BALAO = "showing:balao-visto";
const ESPERA_DO_BALAO_MS = 8000;
const MAXIMO_DE_HORARIOS = 4;

const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

// Bolha de chat (pages.md §4): botão com a foto do corretor, balão de convite, painel de
// 380 × 600 no desktop e folha em tela cheia no celular.
export default function ChatBubble({ imovelId, tituloImovel, corretor, imovel, whatsapp, fotoSrc, semMetricas }: Props) {
  const conversa = useConversa({ imovelId, corretor, imovel });
  const { mensagens, digitando, carregando, falha, simulado, encerrada, enviar, tentarDeNovo, iniciar } = conversa;

  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [balao, setBalao] = useState(false);

  const botao = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const avisoFim = useRef<HTMLDivElement>(null);
  const fim = useRef<HTMLDivElement>(null);

  const abrir = useCallback(
    (modo: ModoChat) => {
      setAberto(true);
      setBalao(false);
      if (!semMetricas) registrarEventoUmaVez("chat_aberto", imovelId);
      void iniciar(modo);
    },
    [iniciar, imovelId, semMetricas],
  );

  useEffect(() => {
    const aoPedir = (e: Event) => abrir((e as CustomEvent<ModoChat>).detail ?? "conversa");
    window.addEventListener(EVENTO_ABRIR_CHAT, aoPedir);
    window.dispatchEvent(new Event(EVENTO_CHAT_PRONTO));
    return () => window.removeEventListener(EVENTO_ABRIR_CHAT, aoPedir);
  }, [abrir]);

  // Balão "Dúvidas sobre este imóvel?" depois de 8 s, uma vez por sessão.
  useEffect(() => {
    let visto = false;
    try {
      visto = window.sessionStorage.getItem(CHAVE_BALAO) === "1";
    } catch {
      // sem sessionStorage: mostra mesmo assim
    }
    if (visto) return;
    const id = window.setTimeout(() => {
      setBalao(true);
      try {
        window.sessionStorage.setItem(CHAVE_BALAO, "1");
      } catch {
        // ignora
      }
    }, ESPERA_DO_BALAO_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (encerrada) avisoFim.current?.focus();
  }, [encerrada]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens, digitando, falha, aberto]);

  const ultima = mensagens[mensagens.length - 1];
  const sugestoesBrutas = !digitando && !encerrada && ultima?.papel === "assistente" ? ultima.sugestoes : undefined;
  const sugestoes = ultima?.pedeConsentimento ? sugestoesBrutas : sugestoesBrutas?.slice(0, MAXIMO_DE_HORARIOS);

  function mandar() {
    const conteudo = texto;
    setTexto("");
    if (campo.current) campo.current.style.height = "auto";
    void enviar(conteudo);
  }

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto} modal="trap-focus">
      {balao && !aberto && (
        <div className="fixed right-4 bottom-[9.5rem] z-40 flex max-w-[15rem] items-start gap-1 rounded-2xl bg-card p-1 pl-4 shadow-lg ring-1 ring-foreground/10 lg:bottom-24">
          <button type="button" onClick={() => abrir("conversa")} className="min-h-11 py-2 text-left text-sm font-medium focus-visible:outline-none">
            Dúvidas sobre este imóvel?
          </button>
          <button
            type="button"
            onClick={() => setBalao(false)}
            aria-label="Dispensar o convite"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <button
        ref={botao}
        type="button"
        aria-label="Abrir conversa com o atendente virtual"
        aria-expanded={aberto}
        onClick={() => (aberto ? setAberto(false) : abrir("conversa"))}
        className="fixed right-4 bottom-20 z-40 size-14 rounded-full shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:bottom-6"
      >
        <Avatar className="size-14 ring-2 ring-white">
          {fotoSrc && <AvatarImage src={fotoSrc} alt="" />}
          <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">{iniciais(corretor)}</AvatarFallback>
        </Avatar>
        <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-cta text-cta-foreground ring-2 ring-white" aria-hidden>
          <MessageCircle className="size-3.5" />
        </span>
      </button>

      <Dialog.Portal>
        <Dialog.Popup
          initialFocus={campo}
          finalFocus={botao}
          aria-describedby={undefined}
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-background outline-none",
            "transition-[transform,opacity] duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none",
            "sm:inset-auto sm:right-4 sm:bottom-24 sm:h-[600px] sm:max-h-[calc(100dvh-7rem)] sm:w-[380px] sm:rounded-3xl sm:border sm:shadow-lg",
            "sm:data-[ending-style]:translate-y-4 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-4 sm:data-[starting-style]:opacity-0",
          )}
        >
          <header className="flex items-center gap-3 bg-primary py-2 pr-2 pl-4 text-primary-foreground sm:rounded-t-3xl">
            <Avatar className="size-10 ring-2 ring-white/40">
              {fotoSrc && <AvatarImage src={fotoSrc} alt="" />}
              <AvatarFallback className="bg-white/20 text-sm font-semibold text-primary-foreground">{iniciais(corretor)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <Dialog.Title className="truncate text-base font-semibold">Assistente virtual de {corretor}</Dialog.Title>
              <p className="text-xs text-primary-foreground/80">Responde na hora</p>
            </div>
            <Dialog.Close
              render={<Button variant="ghost" size="icon" className="size-11 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label="Fechar conversa" />}
            >
              <X />
            </Dialog.Close>
          </header>

          <div role="log" aria-live="polite" aria-label="Conversa com o atendente" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {carregando && (
              <p role="status" className="self-center text-sm text-muted-foreground">
                Retomando a conversa…
              </p>
            )}
            {mensagens.map((m) => (
              <div key={m.id} className="contents">
                {(m.papel === "usuario" || m.texto !== "") && (
                  <p
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-base leading-snug whitespace-pre-line",
                      m.papel === "usuario" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted",
                    )}
                  >
                    {m.texto}
                  </p>
                )}
                {m.visita && <CartaoVisita horario={m.visita.horario} imovel={tituloImovel} />}
              </div>
            ))}
            {digitando && (
              <p className="self-start rounded-2xl bg-muted px-4 py-2 text-muted-foreground" role="status">
                <span aria-hidden>···</span>
                <span className="sr-only">O atendente está digitando</span>
              </p>
            )}
            {falha && (
              <div role="alert" className="flex flex-col items-start gap-2 self-start rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                <p>{falha.texto}</p>
                <Button type="button" variant="outline" className="h-11 rounded-full" onClick={tentarDeNovo}>
                  Tentar de novo
                </Button>
              </div>
            )}
            {sugestoes && sugestoes.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={ultima?.pedeConsentimento ? "Consentimento" : "Sugestões de resposta"}>
                {sugestoes.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => void enviar(s)}
                      className="min-h-11 rounded-full border border-primary bg-background px-4 text-sm text-primary hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div ref={fim} />
          </div>

          <footer className="flex flex-col gap-2 border-t p-3">
            {encerrada ? (
              <div ref={avisoFim} tabIndex={-1} role="status" className="flex flex-col gap-3 rounded-2xl bg-muted p-4 text-sm outline-none">
                <p>
                  <strong>Esta conversa chegou ao limite de mensagens.</strong> Para continuar, fale direto com {corretor} pelos contatos da
                  página.
                </p>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-fit items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
                  >
                    Chamar no WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  mandar();
                }}
              >
                <textarea
                  ref={campo}
                  value={texto}
                  rows={1}
                  maxLength={500}
                  aria-label="Sua mensagem"
                  placeholder="Digite sua mensagem"
                  onChange={(e) => {
                    setTexto(e.target.value);
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 112)}px`;
                  }}
                  onKeyDown={(e) => {
                    // Enter envia; Shift+Enter quebra a linha.
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      mandar();
                    }
                  }}
                  className="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border bg-background px-4 py-2.5 text-base leading-snug outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button type="submit" size="icon" className="size-11 rounded-full" aria-label="Enviar mensagem" disabled={digitando || texto.trim() === ""}>
                  <Send />
                </Button>
              </form>
            )}
            {simulado && <p className="text-center text-xs font-medium text-cta">Atendente de demonstração: as respostas são simuladas.</p>}
            <p className="text-center text-xs text-muted-foreground">
              Assistente virtual. Ao conversar, você concorda com a{" "}
              <Link href="/privacidade" target="_blank" className="underline underline-offset-2">
                política de privacidade
              </Link>
              .
            </p>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
