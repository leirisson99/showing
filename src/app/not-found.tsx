import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { RodapeSite } from "@/components/site/RodapeSite";
import { TelaDeErro } from "@/components/site/TelaDeErro";

export default function NaoEncontrado() {
  return (
    <>
      <CabecalhoSite tom="claro" links={[]} acao={null} />
      <TelaDeErro
        titulo="Página não encontrada"
        texto="O endereço pode estar errado ou a página não está mais disponível."
        voltar={{ href: "/", rotulo: "Ir para o início" }}
      />
      <RodapeSite />
    </>
  );
}
