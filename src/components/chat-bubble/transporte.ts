// Cliente da rota /api/chat (NDJSON, uma linha JSON por evento).

export type EventoChat =
  | { tipo: "inicio"; conversaId: string }
  | { tipo: "texto"; texto: string }
  | { tipo: "fim"; sugestoes?: string[]; pedeConsentimento?: boolean; encerrada?: boolean }
  | { tipo: "erro"; texto: string };

export class ErroApi extends Error {
  constructor(
    readonly codigo: string,
    readonly status: number,
  ) {
    super(codigo);
  }
}

type Pedido = { imovelId: string; conversaId: string | null; mensagem: string; signal?: AbortSignal };

export async function* conversarComApi({ imovelId, conversaId, mensagem, signal }: Pedido): AsyncGenerator<EventoChat> {
  const resposta = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imovelId, mensagem, ...(conversaId ? { conversaId } : {}) }),
    signal,
  });

  if (!resposta.ok || !resposta.body) {
    const corpo = await resposta.json().catch(() => null);
    throw new ErroApi(typeof corpo?.erro === "string" ? corpo.erro : "erro_desconhecido", resposta.status);
  }

  const leitor = resposta.body.pipeThrough(new TextDecoderStream()).getReader();
  let pendente = "";
  for (;;) {
    const { value, done } = await leitor.read();
    if (done) break;
    pendente += value;
    const linhas = pendente.split("\n");
    pendente = linhas.pop() ?? "";
    for (const linha of linhas) {
      if (!linha.trim()) continue;
      try {
        yield JSON.parse(linha) as EventoChat;
      } catch {
        // linha quebrada: ignora e segue
      }
    }
  }
}
