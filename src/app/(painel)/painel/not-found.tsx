import { TelaDeErro } from "@/components/site/TelaDeErro";

export default function NaoEncontradoNoPainel() {
  return (
    <TelaDeErro
      titulo="Não encontramos isso"
      texto="O item não existe ou não é do seu painel. Volte e escolha pela lista."
      voltar={{ href: "/painel", rotulo: "Voltar ao painel" }}
    />
  );
}
