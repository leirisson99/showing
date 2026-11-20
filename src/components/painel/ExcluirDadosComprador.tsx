"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { anonimizarClienteAction, anonimizarConversaAction } from "@/app/(painel)/painel/conversas/anonimizar-actions";
import { useAcao } from "./use-acao";

// RN-24: apaga nome, contato e dado pessoal citado no texto; as mensagens ficam sem identificar o comprador.
export function ExcluirDadosComprador({ tipo, id }: { tipo: "conversa" | "cliente"; id: string }) {
  const router = useRouter();
  const { rodar, pendente } = useAcao();
  const [aberto, setAberto] = useState(false);

  function confirmar() {
    rodar(
      () => (tipo === "cliente" ? anonimizarClienteAction(id) : anonimizarConversaAction(id)),
      "Dados do comprador removidos",
      () => {
        setAberto(false);
        if (tipo === "cliente") router.push("/painel/clientes");
        else router.refresh();
      },
    );
  }

  return (
    <AlertDialog open={aberto} onOpenChange={setAberto}>
      <AlertDialogTrigger render={<Button type="button" variant="outline" className="h-11 w-fit rounded-full" />}>
        <Trash2 data-icon="inline-start" /> Excluir dados do comprador
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir os dados deste comprador?</AlertDialogTitle>
          <AlertDialogDescription>
            Apaga nome, telefone, e-mail, forma de pagamento, prazo e a autorização dele
            {tipo === "cliente" ? ", em todas as conversas dele" : ""}, e tira esses dados do texto das mensagens. A conversa e as visitas continuam, sem
            identificar o comprador. Não dá para desfazer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pendente} onClick={confirmar}>
            Excluir os dados
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
