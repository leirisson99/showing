import { Bath, BedDouble, Car, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatarArea, formatarPreco } from "@/lib/format";
import type { ImovelPublico } from "@/lib/imoveis";

export function PrecoImovel({ imovel }: { imovel: ImovelPublico }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[28px] leading-tight font-bold text-primary lg:text-[32px]">
        {formatarPreco(imovel.preco)}
        {imovel.finalidade === "aluguel" && <span className="text-base font-medium text-muted-foreground"> /mês</span>}
      </p>
      {(imovel.condominio !== null || imovel.iptu !== null) && (
        <p className="text-sm text-muted-foreground">
          {imovel.condominio !== null && <>Condomínio {formatarPreco(imovel.condominio)}</>}
          {imovel.condominio !== null && imovel.iptu !== null && " · "}
          {imovel.iptu !== null && <>IPTU {formatarPreco(imovel.iptu)}</>}
        </p>
      )}
    </div>
  );
}

export function SelosDoImovel({ imovel }: { imovel: ImovelPublico }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary" className="h-7 rounded-full px-3">{imovel.finalidade === "venda" ? "À venda" : "Para alugar"}</Badge>
      {imovel.aceitaFinanciamento && <Badge variant="secondary" className="h-7 rounded-full px-3">Aceita financiamento</Badge>}
      {imovel.aceitaFgts && <Badge variant="secondary" className="h-7 rounded-full px-3">Aceita FGTS</Badge>}
    </div>
  );
}

// Lista de medidas do cartão "Ficha técnica" (modelo 2).
export function MedidasDoImovel({ imovel }: { imovel: ImovelPublico }) {
  const itens = [
    {
      Icone: BedDouble,
      texto: `${imovel.quartos} ${imovel.quartos === 1 ? "quarto" : "quartos"}${imovel.suites ? ` (${imovel.suites} ${imovel.suites === 1 ? "suíte" : "suítes"})` : ""}`,
    },
    { Icone: Bath, texto: `${imovel.banheiros} ${imovel.banheiros === 1 ? "banheiro" : "banheiros"}` },
    { Icone: Car, texto: `${imovel.vagas} ${imovel.vagas === 1 ? "vaga de garagem" : "vagas de garagem"}` },
    { Icone: Ruler, texto: `${formatarArea(imovel.areaM2)} de área` },
  ];
  return (
    <ul className="flex flex-col gap-3">
      {itens.map(({ Icone, texto }) => (
        <li key={texto} className="flex items-center gap-3 text-base font-medium">
          <Icone className="size-5 shrink-0 text-cta" aria-hidden />
          {texto}
        </li>
      ))}
    </ul>
  );
}
