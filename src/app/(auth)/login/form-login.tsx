"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pedirLink, type EstadoLogin } from "./actions";

const inicial: EstadoLogin = {};

export function FormLogin() {
  const [estado, action, pendente] = useActionState(pedirLink, inicial);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={estado.erro ? true : undefined}
          aria-describedby={estado.erro ? "email-erro" : undefined}
          required
        />
        {estado.erro && (
          <p id="email-erro" role="alert" className="text-sm text-destructive">
            {estado.erro}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pendente}>
        {pendente ? "Enviando…" : "Receber link de acesso"}
      </Button>
    </form>
  );
}
