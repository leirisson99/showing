import { Card, CardContent } from "@/components/ui/card";
import type { InfoBairro as Info } from "@/lib/imoveis";

export function InfoBairro({ info, bairro }: { info: Info; bairro: string }) {
  const grupos = [
    { titulo: "Escolas", itens: info.escolas },
    { titulo: "Mercados e comércio", itens: info.mercados },
    { titulo: "Saúde", itens: info.saude },
  ].filter((g) => g.itens.length > 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          {bairro} fica a {info.distanciaCentro} do centro.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {grupos.map((g) => (
            <div key={g.titulo}>
              <h3 className="mb-1 font-semibold">{g.titulo}</h3>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {g.itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
