import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { exigirCorretor } from "@/lib/session";

// A pré-visualização é a página pública do imóvel, sem o cabeçalho do painel por cima.
// Só o corretor logado entra (o proxy também protege /painel/*).
export default function PreviaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Skeleton className="h-screen w-full rounded-none" />}>
      <Protegida>{children}</Protegida>
    </Suspense>
  );
}

async function Protegida({ children }: { children: React.ReactNode }) {
  await exigirCorretor();
  return children;
}
