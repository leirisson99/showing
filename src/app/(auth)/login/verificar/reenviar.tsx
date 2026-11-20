"use client";

import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { reenviarLink, type EstadoLogin } from "../actions";

const ESPERA_SEGUNDOS = 60;
const inicial: EstadoLogin = {};

export function Reenviar({ email }: { email: string }) {
  const [estado, action, pendente] = useActionState(reenviarLink, inicial);
  const [restante, setRestante] = useState(ESPERA_SEGUNDOS);

  useEffect(() => {
    if (restante <= 0) return;
    const id = setTimeout(() => setRestante((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [restante]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia a contagem após o reenvio
    if (estado.enviado) setRestante(ESPERA_SEGUNDOS);
  }, [estado]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pendente || restante > 0}
        className="inline-flex h-12 items-center justify-center rounded-[8px] border border-(--auth-line) bg-(--auth-surface) font-medium text-(--auth-primary) hover:bg-(--auth-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--auth-primary) disabled:cursor-not-allowed disabled:text-(--auth-ink-muted) disabled:hover:bg-(--auth-surface)"
      >
        {restante > 0 ? `Reenviar em ${restante} s` : pendente ? "Enviando…" : "Reenviar link"}
      </button>
      <div role="status" className="min-h-5 text-sm">
        {estado.enviado && (
          <p className="flex items-center gap-1.5 text-(--auth-success-ink)">
            <Check className="size-4" aria-hidden /> Link reenviado.
          </p>
        )}
        {estado.erro && <p className="text-(--auth-danger)">{estado.erro}</p>}
      </div>
    </form>
  );
}
