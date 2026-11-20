import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { usarMocks } from "@/lib/mocks";
import { aplicarRetencao } from "@/lib/retencao";

// Rotina do prazo de guarda (RN-24): chame uma vez por dia por um cron da hospedagem, com
// `Authorization: Bearer <CRON_SECRET>`. Sem CRON_SECRET a rota fica desligada.
export async function POST(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || usarMocks()) return NextResponse.json({ erro: "indisponivel" }, { status: 404 });

  const enviado = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(enviado);
  const b = Buffer.from(segredo);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ erro: "nao_autorizado" }, { status: 401 });

  const { anonimizadas } = await aplicarRetencao();
  console.info("retencao: conversas anonimizadas", { total: anonimizadas });
  return NextResponse.json({ anonimizadas });
}
