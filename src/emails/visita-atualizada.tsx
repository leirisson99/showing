import { Linha, Moldura } from "./Moldura";

type Props = { nome: string; imovel: string; dataHora: string; corretor: string; situacao: "confirmada" | "cancelada"; link: string };

// Aviso ao comprador quando o corretor confirma ou cancela a visita.
export function VisitaAtualizada({ nome, imovel, dataHora, corretor, situacao, link }: Props) {
  const confirmada = situacao === "confirmada";
  return (
    <Moldura
      titulo={confirmada ? "Sua visita foi confirmada" : "Sua visita foi cancelada"}
      intro={confirmada ? `Oi, ${nome}! ${corretor} confirmou a visita.` : `Oi, ${nome}. ${corretor} precisou cancelar esta visita. Você pode combinar outro horário pela página do imóvel.`}
      botao={{ texto: "Ver o imóvel", href: link }}
    >
      <Linha rotulo="Imóvel" valor={imovel} />
      <Linha rotulo="Horário" valor={dataHora} />
      <p style={{ margin: "0 0 12px" }} />
    </Moldura>
  );
}
