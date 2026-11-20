import { Linha, Moldura } from "./Moldura";

type Props = { nome: string; imovel: string; dataHora: string; corretor: string; link: string };

// Confirmação ao comprador: o pedido foi enviado; quem confirma é o corretor (RN-20).
export function PedidoRecebido({ nome, imovel, dataHora, corretor, link }: Props) {
  return (
    <Moldura titulo="Recebemos o seu pedido de visita" intro={`Oi, ${nome}! ${corretor} vai confirmar o horário com você.`} botao={{ texto: "Ver o imóvel", href: link }}>
      <Linha rotulo="Imóvel" valor={imovel} />
      <Linha rotulo="Horário pedido" valor={dataHora} />
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#737373" }}>Você só recebe este e-mail porque pediu uma visita. Não é uma confirmação: o corretor ainda precisa aceitar.</p>
    </Moldura>
  );
}
