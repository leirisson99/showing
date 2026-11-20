"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calcularHorariosLivres } from "@/lib/ai/horarios";
import type { ModoChat } from "./eventos";
import { conversaEncerrada } from "./limite";
import { ESTADO_INICIAL, responder, saudacao, type ContextoMock, type Estado, type Resposta } from "./mock-atendente";
import { carregarConversa, conversarComApi, ErroApi, type Consentimento } from "./transporte";

export type Mensagem = Resposta & { id: string; papel: "usuario" | "assistente" };

type Entrada = { imovelId: string; corretor: string; imovel: ContextoMock["imovel"] };

// No aparelho ficam só o id da conversa e se ela encerrou. O texto das mensagens fica no
// servidor e volta por GET /api/chat (RF-17), para não guardar o que o comprador digitou.
type Guardado = { conversaId: string | null; encerrada: boolean };

const chave = (imovelId: string) => `showing:conversa:${imovelId}`;

// localStorage pode falhar (aba privada, bloqueio): tudo em try/catch e a bolha funciona sem.
function ler(imovelId: string): Guardado {
  try {
    const bruto = window.localStorage.getItem(chave(imovelId));
    const dados = bruto ? (JSON.parse(bruto) as Partial<Guardado>) : null;
    return { conversaId: typeof dados?.conversaId === "string" ? dados.conversaId : null, encerrada: dados?.encerrada === true };
  } catch {
    return { conversaId: null, encerrada: false };
  }
}

function gravar(imovelId: string, dados: Guardado) {
  try {
    window.localStorage.setItem(chave(imovelId), JSON.stringify(dados));
  } catch {
    // sem persistência: a conversa segue só na tela
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const novoId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// Horários do corretor usados só pelo atendente simulado; o real recebe de consultar_horarios.
const HORARIOS_SIMULADO = { sab: ["09:00", "10:00", "11:00"], dom: ["10:00"] };

export type Falha = { texto: string; mensagem: string; consentimento?: Consentimento };

export function useConversa({ imovelId, corretor, imovel }: Entrada) {
  const [guardado] = useState(() => ler(imovelId));
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [estado, setEstado] = useState<Estado>(ESTADO_INICIAL);
  const [digitando, setDigitando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [falha, setFalha] = useState<Falha | null>(null);
  const [simulado, setSimulado] = useState(false);
  const [encerradaNoServidor, setEncerradaNoServidor] = useState(guardado.encerrada);

  const ultima = mensagens[mensagens.length - 1];
  const encerrada = conversaEncerrada({
    encerradaNoServidor,
    mensagensDoComprador: mensagens.filter((m) => m.papel === "usuario").length,
    digitando,
    ultimoPapel: ultima?.papel,
  });

  const conversaId = useRef<string | null>(guardado.conversaId);
  const vivo = useRef(true);
  const modoSimulado = useRef(false);
  const atual = useRef({ mensagens, estado, digitando, encerrada });

  useEffect(() => {
    atual.current = { mensagens, estado, digitando, encerrada };
  });

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const contexto = useCallback(
    (): ContextoMock => ({
      corretor,
      imovel,
      horarios: calcularHorariosLivres({ horariosVisita: HORARIOS_SIMULADO, duracaoMin: 60, ocupados: [], agora: new Date() }).map((h) => ({
        iso: h.iso,
        rotulo: h.rotulo,
      })),
    }),
    [corretor, imovel],
  );

  const adicionar = useCallback((m: Mensagem) => setMensagens((anteriores) => [...anteriores, m]), []);
  const atualizar = useCallback(
    (id: string, mudar: (m: Mensagem) => Mensagem) => setMensagens((ms) => ms.map((m) => (m.id === id ? mudar(m) : m))),
    [],
  );

  const guardarConversa = useCallback(
    (id: string | null, encerrou: boolean) => {
      conversaId.current = id;
      gravar(imovelId, { conversaId: id, encerrada: encerrou });
    },
    [imovelId],
  );

  const textoDoErro = (e: unknown): string => {
    if (e instanceof ErroApi && e.codigo === "muitas_mensagens") return "Muitas mensagens em pouco tempo. Espere um instante e tente de novo.";
    if (e instanceof ErroApi && e.codigo === "conversa_nao_encontrada") return "Não encontrei esta conversa. Vou começar outra quando você tentar de novo.";
    return "Não consegui responder agora. Tente de novo.";
  };

  // Resposta da IA (rota /api/chat) em streaming. Devolve false só quando a IA não está
  // configurada (503), para cair no atendente simulado.
  const enviarParaApi = useCallback(
    async (limpo: string, consentimento?: Consentimento): Promise<boolean> => {
      let id: string | null = null;
      try {
        for await (const ev of conversarComApi({ imovelId, conversaId: conversaId.current, mensagem: limpo, consentimento })) {
          if (!vivo.current) return true;
          if (ev.tipo === "inicio") {
            guardarConversa(ev.conversaId, false);
          } else if (ev.tipo === "texto") {
            if (id === null) {
              id = novoId();
              setDigitando(false);
              adicionar({ id, papel: "assistente", texto: ev.texto });
            } else {
              atualizar(id, (m) => ({ ...m, texto: m.texto + ev.texto }));
            }
          } else if (ev.tipo === "erro") {
            setDigitando(false);
            setFalha({ texto: ev.texto, mensagem: limpo, consentimento });
          } else if (ev.tipo === "fim") {
            if (ev.encerrada) {
              setEncerradaNoServidor(true);
              guardarConversa(conversaId.current, true);
            }
            if (id !== null) {
              atualizar(id, (m) => ({ ...m, sugestoes: ev.sugestoes, pedeConsentimento: ev.pedeConsentimento, visita: ev.visita }));
            }
          }
        }
        setDigitando(false);
        return true;
      } catch (e) {
        if (e instanceof ErroApi && e.codigo === "ia_indisponivel") return false;
        if (e instanceof ErroApi && e.codigo === "conversa_nao_encontrada") guardarConversa(null, false);
        setDigitando(false);
        setFalha({ texto: textoDoErro(e), mensagem: limpo, consentimento });
        return true;
      }
    },
    [adicionar, atualizar, guardarConversa, imovelId],
  );

  // Atendente simulado (mock-atendente.ts), usado quando a IA não está configurada.
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
        atualizar(id, (m) => ({ ...m, texto: palavras.slice(0, i).join(" ") }));
      }
      atualizar(id, (m) => ({ ...m, sugestoes: resposta.sugestoes, pedeConsentimento: resposta.pedeConsentimento, visita: resposta.visita }));
      setEstado(novoEstado);
    },
    [adicionar, atualizar, contexto],
  );

  const enviar = useCallback(
    async (conteudo: string, repetindo = false, consentimento?: Consentimento) => {
      const limpo = conteudo.trim().slice(0, 500);
      if (!limpo || atual.current.digitando || atual.current.encerrada) return;

      setFalha(null);
      if (!repetindo) adicionar({ id: novoId(), papel: "usuario", texto: limpo });
      setDigitando(true);

      if (!modoSimulado.current && (await enviarParaApi(limpo, consentimento))) return;
      modoSimulado.current = true;
      setSimulado(true);
      await enviarSimulado(limpo);
    },
    [adicionar, enviarParaApi, enviarSimulado],
  );

  /** Reenvia a última mensagem depois de uma falha, sem duplicá-la na tela. */
  const tentarDeNovo = useCallback(() => {
    const mensagem = falha?.mensagem;
    if (mensagem) void enviar(mensagem, true, falha?.consentimento);
  }, [enviar, falha]);

  // Primeira abertura: retoma a conversa do servidor (se houver id) ou mostra a saudação.
  const iniciar = useCallback(
    async (modo: ModoChat) => {
      if (atual.current.mensagens.length === 0) {
        const saudacaoInicial: Mensagem = { id: novoId(), papel: "assistente", ...saudacao(contexto()) };
        let retomada = false;

        if (conversaId.current) {
          setCarregando(true);
          try {
            const h = await carregarConversa(imovelId, conversaId.current);
            if (!vivo.current) return;
            const anteriores: Mensagem[] = h.mensagens.map((m) => ({ id: novoId(), papel: m.papel, texto: m.texto }));
            setMensagens([{ ...saudacaoInicial, sugestoes: undefined }, ...anteriores]);
            if (h.encerrada) setEncerradaNoServidor(true);
            retomada = true;
          } catch (e) {
            // Conversa que o servidor não conhece mais (ou rede fora): começa uma nova.
            if (e instanceof ErroApi && e.status === 404) guardarConversa(null, false);
          } finally {
            if (vivo.current) setCarregando(false);
          }
        }
        if (!retomada) setMensagens([saudacaoInicial]);
        if (retomada && modo !== "agendamento") return;
        if (modo === "agendamento" && !atual.current.encerrada) void enviar("Quero agendar uma visita");
        return;
      }
      if (modo === "agendamento" && atual.current.estado.fase === "livre" && !atual.current.encerrada) {
        void enviar("Quero agendar uma visita");
      }
    },
    [contexto, enviar, guardarConversa, imovelId],
  );

  return { mensagens, digitando, carregando, falha, simulado, encerrada, enviar, tentarDeNovo, iniciar };
}
