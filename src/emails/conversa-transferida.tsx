import { Linha, Moldura } from "./Moldura";

type Props = { imovel: string; motivo: string; link: string };

// Aviso ao corretor: o atendente não soube responder e passou a conversa.
export function ConversaTransferida({ imovel, motivo, link }: Props) {
  return (
    <Moldura titulo="Uma conversa passou para você" intro="O atendente não tinha essa informação na ficha e pediu a sua ajuda." botao={{ texto: "Abrir a conversa", href: link }}>
      <Linha rotulo="Imóvel" valor={imovel} />
      <Linha rotulo="Motivo" valor={motivo} />
      <p style={{ margin: "0 0 12px" }} />
    </Moldura>
  );
}
