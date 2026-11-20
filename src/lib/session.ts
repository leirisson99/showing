import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CORRETOR_MOCK, usarMocks } from "@/lib/mocks";

// Corretor logado. Toda consulta do painel parte do id devolvido aqui (RN-07).
export const exigirCorretor = cache(async () => {
  // USAR_MOCKS=1 (só em desenvolvimento): corretor fixo, sem login.
  if (usarMocks()) return CORRETOR_MOCK;

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
