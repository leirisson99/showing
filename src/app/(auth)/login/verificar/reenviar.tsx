"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    if (estado.enviado) {
      toast.success("Link reenviado");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia a contagem após o reenvio
      setRestante(ESPERA_SEGUNDOS);
    }
    if (estado.erro) toast.error(estado.erro);
  }, [estado]);

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="outline" disabled={pendente || restante > 0}>
        {restante > 0 ? `Reenviar em ${restante} s` : pendente ? "Enviando…" : "Reenviar link"}
      </Button>
    </form>
  );
}
