import type { Metadata } from "next";
import Link from "next/link";
import { botaoEscuro } from "@/components/site/estilos";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { RodapeSite } from "@/components/site/RodapeSite";
import { retencaoDias } from "@/lib/lgpd";

export const metadata: Metadata = {
  title: "Política de privacidade — Showing",
  description: "Que dados o atendente virtual do Showing coleta, para quê, quem vê e como pedir a exclusão.",
  alternates: { canonical: "/privacidade" },
};

const ATUALIZADA_EM = "20 de novembro de 2026";

type Secao = { titulo: string; conteudo: React.ReactNode };

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {itens.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

// Texto em linguagem simples, sem juridiquês (pages.md §3.3). Versão do piloto: revisar
// com alguém de confiança antes de abrir para o público (RNF-14).
export default function PrivacidadePage() {
  const email = process.env.NEXT_PUBLIC_EMAIL_PRIVACIDADE;

  const secoes: Secao[] = [
    {
      titulo: "O que é o Showing",
      conteudo: (
        <p>
          O Showing cria uma página para cada imóvel e coloca nela um atendente virtual, uma inteligência artificial que conversa com quem
          visita a página, tira dúvidas com os dados do anúncio e ajuda a pedir uma visita. Hoje o serviço está em teste com corretores de
          Blumenau.
        </p>
      ),
    },
    {
      titulo: "Quais dados coletamos",
      conteudo: (
        <>
          <p>Você não cria conta nem faz login para olhar um imóvel ou conversar. Os dados vêm só do que você faz:</p>
          <Lista
            itens={[
              "As mensagens que você escreve na conversa com o atendente.",
              "Se você autorizar na conversa: nome, telefone e/ou e-mail, forma de pagamento e prazo que você informou.",
              "A data e a hora em que você deu essa autorização e o horário de visita que você pediu.",
              "Contagens de uso sem identificar você, como visualizações da página e aberturas da conversa.",
              "No seu aparelho, o código da conversa, para você retomá-la ao voltar à página.",
            ]}
          />
          <p>Nome e contato só são guardados depois que você aceita, na própria conversa. Se disser que não, não guardamos.</p>
          <p>
            Se você é corretor e deixa o seu e-mail na página inicial para participar do piloto, guardamos só esse e-mail, para falar com você
            sobre o piloto. Você pode pedir para apagá-lo a qualquer momento.
          </p>
        </>
      ),
    },
    {
      titulo: "Para que usamos",
      conteudo: (
        <Lista
          itens={[
            "Responder suas dúvidas sobre o imóvel.",
            "Registrar o pedido de visita e avisar o corretor, que confirma o horário com você.",
            "Passar ao corretor as perguntas que o atendente não soube responder.",
            "Durante o piloto, a equipe do Showing lê conversas para revisar e melhorar o atendente.",
          ]}
        />
      ),
    },
    {
      titulo: "Quem vê seus dados",
      conteudo: (
        <>
          <Lista
            itens={[
              "O corretor responsável pelo imóvel em que você conversou. Nenhum outro corretor vê.",
              "A equipe do Showing, para suporte e revisão do atendente.",
              "O serviço de inteligência artificial que gera as respostas: o texto das suas mensagens é enviado a ele para formular a resposta.",
              "Os serviços de hospedagem e de armazenamento que mantêm o Showing no ar.",
            ]}
          />
          <p>Não vendemos seus dados nem os usamos para publicidade.</p>
        </>
      ),
    },
    {
      titulo: "Por quanto tempo guardamos",
      conteudo: (
        <p>
          Guardamos a conversa por até {retencaoDias()} dias depois da última mensagem. Passado esse prazo, apagamos seu nome, seus contatos e
          o que você tenha escrito que identifique você; o restante da conversa pode ser mantido sem identificar ninguém. Se houver uma visita
          marcada, os dados ficam até ela acontecer. Você pode pedir a exclusão antes disso.
        </p>
      ),
    },
    {
      titulo: "Seus direitos",
      conteudo: (
        <>
          <p>Pela Lei Geral de Proteção de Dados (LGPD), você pode, a qualquer momento:</p>
          <Lista
            itens={[
              "Saber se temos dados seus e receber uma cópia.",
              "Corrigir dados incorretos.",
              "Pedir a exclusão dos seus dados e retirar a autorização que deu.",
            ]}
          />
          <p>
            {email ? (
              <>
                Para pedir, escreva para{" "}
                <a href={`mailto:${email}`} className="font-medium underline underline-offset-4">
                  {email}
                </a>
                , ou fale com o corretor do imóvel.
              </>
            ) : (
              <>Para pedir, fale com o corretor do imóvel em que você conversou: ele encaminha o pedido ao Showing.</>
            )}
          </p>
        </>
      ),
    },
    {
      titulo: "O que acontece quando você pede a exclusão",
      conteudo: (
        <p>
          Apagamos seu nome, seus contatos e o perfil que o atendente montou sobre você. As mensagens da conversa podem ser mantidas, mas sem
          nada que identifique você.
        </p>
      ),
    },
    {
      titulo: "Segurança",
      conteudo: (
        <p>
          Seus dados ficam em servidores, nunca no navegador de outras pessoas, e só o corretor dono do imóvel os acessa pelo painel dele. As
          chaves dos serviços ficam guardadas só no servidor. O atendente não pede nem precisa de documentos, senhas ou dados de cartão.
        </p>
      ),
    },
  ];

  return (
    <>
      <CabecalhoSite
        tom="claro"
        login={false}
        links={[]}
        acao={
          <Link href="/" className={botaoEscuro}>
            Voltar ao início
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-6 pb-20">
        <p className="text-sm font-semibold tracking-wide text-cta uppercase">Privacidade</p>
        <h1 className="mt-3 text-4xl leading-tight font-medium md:text-5xl">Política de privacidade</h1>
        <p className="mt-4 text-muted-foreground">
          Como o Showing trata os dados de quem conversa com o atendente. Versão do piloto, atualizada em {ATUALIZADA_EM}.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {secoes.map((s) => (
            <section key={s.titulo} className="flex flex-col gap-3 text-base leading-relaxed">
              <h2 className="text-2xl font-medium">{s.titulo}</h2>
              {s.conteudo}
            </section>
          ))}
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
