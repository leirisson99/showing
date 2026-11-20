import { NextResponse } from "next/server";
import { z } from "zod";
import { registrarEvento } from "@/lib/painel/metricas";
import { dentroDoLimite } from "@/lib/rate-limit";

// Eventos que só o navegador conhece. Os outros (mensagem, contato, visita, transferência)
// são registrados pelo servidor em /api/chat. Sem dado pessoal: só tipo e imóvel (RNF-19).
const corpo = z.object({
  tipo: z.enum(["visualizacao", "chat_aberto"]),
  imovelId: z.string().min(1).max(100),
});

const LIMITE_POR_MINUTO = 30;

export async function POST(request: Request) {
  const entrada = corpo.safeParse(await request.json().catch(() => null));
  if (!entrada.success) return NextResponse.json({ erro: "pedido_invalido" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconhecido";
  if (!dentroDoLimite(`eventos:${ip}`, LIMITE_POR_MINUTO, 60_000)) return NextResponse.json({ erro: "muitos_pedidos" }, { status: 429 });

  const ok = await registrarEvento(entrada.data.tipo, entrada.data.imovelId);
  return ok ? new NextResponse(null, { status: 204 }) : NextResponse.json({ erro: "imovel_indisponivel" }, { status: 404 });
}
