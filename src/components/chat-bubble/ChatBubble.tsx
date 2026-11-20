"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calcularHorariosLivres } from "@/lib/ai/horarios";
import { cn } from "@/lib/utils";
import { EVENTO_ABRIR_CHAT, EVENTO_CHAT_PRONTO, type ModoChat } from "./eventos";
import { conversarComApi, ErroApi } from "./transporte";
import {
  ESTADO_INICIAL,
  responder,
  saudacao,
  type ContextoMock,
  type Estado,
  type Resposta,
} from "./mock-atendente";

export type Mensagem = Resposta & { id: string; papel: "usuario" | "assistente" };

type Props = {
  imovelId: string;
  corretor: string;
  imovel: ContextoMock["imovel"];
};

type Salvo = { mensagens: Mensagem[]; estado: Estado; conversaId?: string | null };

const chave = (imovelId: string) => `showing:conversa:${imovelId}`;

// localStorage pode falhar (aba privada, bloqueio): tudo dentro de try/catch e a bolha
// funciona sem ele.
function ler(imovelId: string): Salvo | null {
  try {
    const bruto = window.localStorage.getItem(chave(imovelId));
    return bruto ? (JSON.parse(bruto) as Salvo) : null;
  } catch {
    return null;
  }
}

function gravar(imovelId: string, dados: Salvo) {
  try {
    window.localStorage.setItem(chave(imovelId), JSON.stringify(dados));
  } catch {
    // sem persistência: a conversa segue só na tela
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const novoId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Horários do corretor usados só pelo mock; o atendente real recebe de listar_horarios.
const HORARIOS_MOCK = { sab: ["09:00", "10:00", "11:00"], dom: ["10:00"] };

export default function ChatBubble({ imovelId, corretor, imovel }: Props) {
  const [inicial] = useState(() => ler(imovelId));
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>(inicial?.mensagens ?? []);
  const [estado, setEstado] = useState<Estado>(inicial?.estado ?? ESTADO_INICIAL);
  const [digitando, setDigitando] = useState(false);
  const [texto, setTexto] = useState("");

  const botao = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const atual = useRef({ mensagens, estado, digitando });
  const vivo = useRef(true);
  // Id da conversa no servidor (localStorage) e modo simulado quando a IA não está configurada.
  const conversaId = useRef<string | null>(inicial?.conversaId ?? null);
  const simulado = useRef(false);

  useEffect(() => {
    atual.current = { mensagens, estado, digitando };
  });

  const contexto = useCallback(
    (): ContextoMock => ({
      corretor,
      imovel,
      horarios: calcularHorariosLivres({ horariosVisita: HORARIOS_MOCK, duracaoMin: 60, ocupados: [], agora: new Date() }).map(
        (h) => ({ iso: h.iso, rotulo: h.rotulo }),
      ),
    }),
    [corretor, imovel],
  );

  const adicionar = useCallback((m: Mensagem) => setMensagens((anteriores) => [...anteriores, m]), []);

  const mensagemDeErro = (e: unknown): string => {
    if (e instanceof ErroApi && e.codigo === "muitas_mensagens") return "Muitas mensagens em pouco tempo. Espere um instante e tente de novo.";
    if (e instanceof ErroApi && e.codigo === "conversa_nao_encontrada") {
      conversaId.current = null;
      return "Reiniciei a conversa. Pode repetir sua pergunta?";
    }
    return "Não consegui responder agora. Tente de novo em instantes ou fale direto com o corretor.";
  };

  // Resposta da IA (rota /api/chat) em streaming. Devolve false só quando a IA não está
  // configurada (503), para cair no atendente simulado.
  const enviarParaApi = useCallback(
    async (limpo: string): Promise<boolean> => {
      let id: string | null = null;
      const escrever = (trecho: string) => {
        if (id === null) {
          id = novoId();
          setDigitando(false);
          adicionar({ id, papel: "assistente", texto: trecho });
        } else {
          const alvo = id;
          setMensagens((ms) => ms.map((m) => (m.id === alvo ? { ...m, texto: m.texto + trecho } : m)));
        }
      };

      try {
        for await (const ev of conversarComApi({ imovelId, conversaId: conversaId.current, mensagem: limpo })) {
          if (!vivo.current) return true;
          if (ev.tipo === "inicio") conversaId.current = ev.conversaId;
          else if (ev.tipo === "texto") escrever(ev.texto);
          else if (ev.tipo === "erro") escrever(id === null ? ev.texto : `\n${ev.texto}`);
          else if (ev.tipo === "fim" && id !== null) {
            const alvo = id;
            setMensagens((ms) => ms.map((m) => (m.id === alvo ? { ...m, sugestoes: ev.sugestoes, pedeConsentimento: ev.pedeConsentimento } : m)));
          }
        }
        setDigitando(false);
        return true;
      } catch (e) {
        if (e instanceof ErroApi && e.codigo === "ia_indisponivel") return false;
        setDigitando(false);
        escrever(id === null ? mensagemDeErro(e) : `\n${mensagemDeErro(e)}`);
        return true;
      }
    },
    [adicionar, imovelId],
  );

  // Atendente simulado (src/components/chat-bubble/mock-atendente.ts), usado sem IA configurada.
  const enviarSimulado = useCallback(
    async (limpo: string) => {
      const [resposta, novoEstado] = responder(atual.current.estado, limpo, contexto());
      await dormir(600);
      if (!vivo.current) return;

      // Mostra a resposta aos poucos, como no streaming real.
      const id = novoId();
      const palavras = resposta.texto.split(" ");
      setDigitando(false);
      adicionar({ id, papel: "assistente", texto: "" });
      for (let i = 1; i <= palavras.length; i++) {
        await dormir(28);
        if (!vivo.current) return;
        setMensagens((ms) => ms.map((m) => (m.id === id ? { ...m, texto: palavras.slice(0, i).join(" ") } : m)));
      }
      setMensagens((ms) => ms.map((m) => (m.id === id ? { ...m, sugestoes: resposta.sugestoes, pedeConsentimento: resposta.pedeConsentimento } : m)));
      setEstado(novoEstado);
    },
    [adicionar, contexto],
  );

  const enviar = useCallback(
    async (conteudo: string) => {
      const limpo = conteudo.trim().slice(0, 500);
      if (!limpo || atual.current.digitando) return;

      adicionar({ id: novoId(), papel: "usuario", texto: limpo });
      setTexto("");
      setDigitando(true);

      if (!simulado.current && (await enviarParaApi(limpo))) return;
      simulado.current = true;
      await enviarSimulado(limpo);
    },
    [adicionar, enviarParaApi, enviarSimulado],
  );

  const abrir = useCallback(
    (modo: ModoChat) => {
      setAberto(true);
      if (atual.current.mensagens.length === 0) {
        adicionar({ id: novoId(), papel: "assistente", ...saudacao(contexto()) });
        if (modo === "agendamento") void enviar("Quero agendar uma visita");
      } else if (modo === "agendamento" && atual.current.estado.fase === "livre") {
        void enviar("Quero agendar uma visita");
      }
    },
    [adicionar, contexto, enviar],
  );

  useEffect(() => {
    vivo.current = true;
    const aoPedir = (e: Event) => abrir((e as CustomEvent<ModoChat>).detail ?? "conversa");
    window.addEventListener(EVENTO_ABRIR_CHAT, aoPedir);
    window.dispatchEvent(new Event(EVENTO_CHAT_PRONTO));
    return () => {
      vivo.current = false;
      window.removeEventListener(EVENTO_ABRIR_CHAT, aoPedir);
    };
  }, [abrir]);

  useEffect(() => {
    if (!digitando) gravar(imovelId, { mensagens, estado, conversaId: conversaId.current });
  }, [imovelId, mensagens, estado, digitando]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens, digitando, aberto]);

  const ultima = mensagens[mensagens.length - 1];
  const sugestoes = !digitando && ultima?.papel === "assistente" ? ultima.sugestoes : undefined;

  return (
    <Dialog.Root open={aberto} onOpenChange={setAberto} modal="trap-focus">
      <button
        ref={botao}
        type="button"
        aria-label="Abrir conversa com o atendente virtual"
        aria-expanded={aberto}
        onClick={() => (aberto ? setAberto(false) : abrir("conversa"))}
        className="fixed right-4 bottom-20 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:bottom-6"
      >
        <MessageCircle className="size-5" aria-hidden />
        Conversar
      </button>

      <Dialog.Portal>
        <Dialog.Popup
          initialFocus={campo}
          finalFocus={botao}
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none sm:inset-auto sm:right-4 sm:bottom-24 sm:h-[600px] sm:max-h-[calc(100dvh-7rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:shadow-lg"
        >
          <header className="flex items-center justify-between gap-2 bg-primary px-4 py-2 text-primary-foreground sm:rounded-t-2xl">
            <Dialog.Title className="font-heading text-base font-semibold">Assistente virtual de {corretor}</Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon" className="size-11 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label="Fechar conversa" />}
            >
              <X />
            </Dialog.Close>
          </header>

          <div role="log" aria-live="polite" aria-label="Conversa com o atendente" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {mensagens.map((m) => (
              <p
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-base leading-snug whitespace-pre-line",
                  m.papel === "usuario" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted",
                  m.papel === "assistente" && m.texto === "" && "sr-only",
                )}
              >
                {m.texto}
              </p>
            ))}
            {digitando && (
              <p className="self-start rounded-2xl bg-muted px-4 py-2 text-muted-foreground" role="status">
                <span aria-hidden>···</span>
                <span className="sr-only">O atendente está digitando</span>
              </p>
            )}
            {sugestoes && (
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
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void enviar(texto);
              }}
            >
              <input
                ref={campo}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={500}
                autoComplete="off"
                aria-label="Sua mensagem"
                placeholder="Digite sua mensagem"
                className="h-11 min-w-0 flex-1 rounded-lg border bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="icon" className="size-11" aria-label="Enviar mensagem" disabled={digitando || texto.trim() === ""}>
                <Send />
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              Ao conversar, você concorda com a{" "}
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
