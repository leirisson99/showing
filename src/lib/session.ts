import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CORRETOR_MOCK, usarMocks } from "@/lib/mocks";
import { perfis } from "@/mocks/corretor";
import { ehAdmin } from "@/lib/painel/admin";

// Corretor logado. Toda consulta do painel parte do id devolvido aqui (RN-07).
export const exigirCorretor = cache(async () => {
  // USAR_MOCKS=1 (só em desenvolvimento): corretor fixo, sem login.
  // `connection()` marca a página como dinâmica, como o login real faria ao ler os cookies;
  // sem isso o Next trata a página como estática e reclama de `new Date()` e de `params`.
  if (usarMocks()) {
    await connection();
    return { ...CORRETOR_MOCK, name: perfis().get(CORRETOR_MOCK.id)?.nome ?? null };
  }

  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  const corretor = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!corretor) redirect("/login");

  return corretor;
});

/** Só para quem está em ADMIN_EMAILS; os demais veem 404, como se a rota não existisse. Em USAR_MOCKS o corretor fixo é admin. */
export async function exigirAdmin() {
  const corretor = await exigirCorretor();
  if (!usarMocks() && !ehAdmin(corretor.email)) notFound();
  return corretor;
}

export async function corretorEhAdmin(email: string): Promise<boolean> {
  return usarMocks() || ehAdmin(email);
}
