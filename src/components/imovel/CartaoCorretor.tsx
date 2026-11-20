import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ImovelPublico } from "@/lib/imoveis";
import { BotaoChat } from "./BotaoChat";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function CartaoCorretor({ imovel }: { imovel: ImovelPublico }) {
  const { corretor, status } = imovel;
  const vendido = status === "vendido";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            {corretor.fotoSrc && <AvatarImage src={corretor.fotoSrc} alt={`Foto de ${corretor.nome}`} />}
            <AvatarFallback>{iniciais(corretor.nome)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="font-semibold">{corretor.nome}</p>
            <p className="text-sm text-muted-foreground">{corretor.creci}</p>
          </div>
        </div>
        {vendido ? (
          <>
            <p>Fale com {corretor.nome} sobre outros imóveis.</p>
            {corretor.whatsapp && (
              <a
                href={`https://wa.me/${corretor.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "h-11 px-4 text-base")}
              >
                <MessageCircle data-icon="inline-start" />
                Chamar no WhatsApp
              </a>
            )}
          </>
        ) : (
          <BotaoChat modo="conversa" variante="outline">
            Conversar
          </BotaoChat>
        )}
      </CardContent>
    </Card>
  );
}
