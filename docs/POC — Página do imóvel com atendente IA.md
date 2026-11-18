# POC — Página do imóvel com atendente IA

Nov 17, 2026 · @Leirisson Souza dos santos

## Resumo

A POC prova, em 4 semanas e com 3 corretores autônomos de Blumenau, que uma página exclusiva por imóvel com atendente de IA transforma contatos em visitas agendadas sem o corretor precisar responder.

O corretor envia fotos e dados do imóvel; a plataforma gera a página; o comprador conversa com o atendente, que qualifica e agenda a visita; o corretor recebe o lead pronto. A POC roda em Next.js + Node, com o atendimento numa bolha de chat dentro da própria página: o comprador não é mandado para o WhatsApp, e conversa, lead e visita ficam no mesmo lugar.

## Problema e hipóteses

O corretor autônomo perde compradores porque demora a responder (está em visita, no trânsito ou dormindo) e porque, nos portais, o imóvel dele aparece ao lado de dezenas de concorrentes.

Hipóteses que a POC precisa confirmar ou derrubar:

1. **Adoção:** o corretor aceita mandar fotos e dados por um canal simples e divulgar o link da página.
2. **Atendimento:** o comprador conversa com um atendente de IA sem desistir e aceita agendar visita por ele.
3. **Qualidade:** o atendente responde certo, só com informações da ficha, e passa ao corretor o que não sabe.
4. **Valor:** o corretor percebe ganho de tempo ou de visitas e diz que pagaria por isso.

## Escopo

A POC entrega o mínimo para testar as quatro hipóteses com imóveis e compradores reais.

| Dentro da POC | Fora da POC (depois da validação) |
| --- | --- |
| Painel simples para cadastrar imóvel (fotos, preço, endereço, ficha) | Corretor enviando tudo pelo WhatsApp |
| Descrição e título gerados por IA, revisados pelo corretor | Geração 100% automática sem revisão |
| Página pública do imóvel com galeria, ficha, mapa e SEO básico | Páginas de bairro, blog, domínio próprio do corretor |
| Bolha de chat flutuante na página, sem abrir o WhatsApp | Opção de continuar a conversa no WhatsApp (Evolution API) |
| Qualificação do comprador e pedido de visita com horários fixos do corretor | Integração com Google Agenda |
| Aviso ao corretor por e-mail com o resumo do lead | Aviso no WhatsApp do corretor |
| Contagem de visitas na página, conversas e visitas agendadas | Relatório mensal automático |
| Login simples para 3 corretores | Assinatura, cobrança e multiempresa |

## Fluxo ponta a ponta

&#91;embedded content: fluxo ponta a ponta · 9 passos, 1 desvio\]

O corretor age em três pontos (cadastrar, revisar, divulgar) e só volta a agir quando a visita está pedida ou quando o atendente não sabe responder.

## Arquitetura e stack

&#91;embedded content: arquitetura da POC · 1 app, 4 serviços\]

Um único projeto Next.js (App Router, TypeScript) concentra as páginas públicas, o painel e as rotas de API. A bolha de chat é um componente da página do imóvel que conversa com `/api/chat`, que chama o modelo com as ferramentas do atendente.

- **Front e back:** Next.js + TypeScript, Tailwind para o visual, Prisma ou Drizzle como ORM.
- **IA:** SDK do provedor do modelo ou Vercel AI SDK, com streaming das respostas no chat.
- **Login do corretor:** Auth.js com link mágico por e-mail; não precisa de senha.
- **Deploy:** um serviço só (Vercel, Railway ou VPS com Docker).

## Modelo de dados

Cinco tabelas no PostgreSQL bastam para a POC; o `slug` do imóvel vira a URL pública.

| Tabela | Campos principais | Observação |
| --- | --- | --- |
| `corretores` | id, nome, creci, email, whatsapp, horarios\_visita (JSON) | Horários fixos que o atendente pode oferecer |
| `imoveis` | id, corretor\_id, slug, tipo, bairro, endereco, preco, condominio, iptu, quartos, vagas, area\_m2, aceita\_financiamento, descricao, status | `status`: rascunho, publicado, vendido |
| `fotos` | id, imovel\_id, url, ordem, legenda | Armazenadas em bucket S3-compatível |
| `conversas` | id, imovel\_id, mensagens (JSON), perfil\_lead (JSON), criada\_em | `perfil_lead`: nome, contato, forma de pagamento, prazo |
| `visitas` | id, imovel\_id, conversa\_id, data\_hora, status | `status`: pedida, confirmada, realizada, cancelada |

Visualizações de página ficam numa tabela `eventos` (imovel\_id, tipo, criado\_em) ou num serviço de analytics como Umami ou Plausible.

## Bolha de chat na página

O comprador conversa com o atendente numa bolha flutuante na própria página do imóvel. Nada abre o WhatsApp, então conversa, lead e visita ficam registrados no mesmo sistema.

**Como o comprador usa:**

- Um botão redondo fica fixo no canto inferior direito, com a foto do corretor e o texto "Dúvidas sobre este imóvel?".
- Ao tocar, abre um painel de chat sobre a página. No celular ele ocupa a tela inteira e tem botão de fechar.
- A primeira mensagem já fala do imóvel: "Oi! Sou o assistente do \[corretor\]. Quer saber algo sobre este apartamento no \[bairro\]?"
- Sugestões em botões agilizam o começo: "Aceita financiamento?", "Qual o condomínio?", "Quero agendar uma visita".
- O botão "Agendar visita" da página abre a bolha direto na etapa de agendamento.
- As respostas aparecem em streaming, com indicador de "digitando".
- A conversa fica guardada no navegador: se o comprador recarregar ou voltar no dia seguinte, o histórico continua.
- Antes de confirmar a visita, o atendente pede nome e telefone ou e-mail, com consentimento. Sem WhatsApp, é a única forma de o corretor retomar o contato.
- A confirmação aparece na própria bolha e vai por e-mail para o comprador.

**Implementação:** um componente React `ChatBubble`, carregado só depois da página (lazy), para não pesar o carregamento nem atrapalhar o SEO. Ele usa o `useChat` do Vercel AI SDK ligado ao `/api/chat`, e o id da conversa fica no `localStorage`.

**Atenção:** sem o WhatsApp, quem fecha a página sem deixar contato se perde. Por isso o pedido de contato antes da visita é obrigatório, e a POC mede quantos abrem a bolha e saem sem responder.

## Atendente IA

O atendente responde só com os dados da ficha do imóvel e do bairro, conduz o comprador até uma visita e entrega ao corretor um resumo estruturado. A ficha é pequena e cabe inteira no prompt, então a POC não precisa de RAG nem de banco vetorial.

**Comportamento em três fases:**

1. **Responder:** tira dúvidas sobre preço, condomínio, vagas, financiamento, metragem e localização.
2. **Qualificar:** pergunta, sem parecer formulário, nome, forma de pagamento (financiamento, à vista, FGTS), prazo para mudar e contato.
3. **Agendar:** oferece os horários livres do corretor e registra o pedido de visita.

**Ferramentas (tool calling) que o modelo pode chamar:**

- `listar_horarios(imovel_id)`: devolve os próximos horários livres do corretor.
- `registrar_lead(dados)`: salva o perfil do comprador na conversa.
- `agendar_visita(imovel_id, data_hora)`: cria a visita como "pedida" e dispara o aviso ao corretor.
- `transferir_corretor(motivo)`: marca a conversa para o corretor assumir.

**Guardrails:**

- Nunca inventa informação. O que não está na ficha recebe a resposta "vou confirmar com o corretor", e a pergunta vai no resumo.
- Não negocia preço nem promete aprovação de financiamento.
- Avisa no início que é um assistente virtual do corretor.
- Pede consentimento antes de guardar nome e telefone (LGPD) e tem link para a política de privacidade.
- Mensagens curtas, em português informal, no máximo uma pergunta por mensagem.

**Modelo:** um modelo de custo baixo com tool calling (por exemplo, Claude Haiku ou equivalente) basta para a POC. Troque de modelo só se os testes de qualidade falharem.

## SEO e GEO da página

Na POC, SEO e GEO são feitos corretamente mas não são medidos como resultado: em 4 semanas um domínio novo não ranqueia, então o tráfego vem da divulgação do corretor.

- Páginas geradas no servidor (SSR ou SSG com revalidação no Next.js), rápidas e legíveis sem JavaScript.
- URL descritiva: `/imovel/apartamento-2-quartos-victor-konder-blumenau`.
- `title`, `meta description` e Open Graph gerados da ficha, para o link aparecer bonito no WhatsApp e no Instagram.
- Dados estruturados schema.org em JSON-LD (`RealEstateListing`, `Offer`, `Place`).
- `sitemap.xml` e `robots.txt` automáticos.
- `llms.txt` e uma versão em texto limpo de cada imóvel, para facilitar leitura por LLMs.
- Imagens com `alt` descritivo, otimizadas pelo `next/image`.
- Página marcada como `noindex` quando o imóvel for vendido.

## SEO local

O site disputa buscas locais e específicas ("apartamento 2 quartos Victor Konder", "\[nome\] corretor Blumenau"), não "apartamento Blumenau", que pertence aos portais. Um domínio novo leva de 3 a 6 meses para aparecer nessas buscas, então o SEO é bônus que cresce, nunca a promessa de venda.

**Durante a POC (sem custo de desenvolvimento):**

- [ ] Cadastrar o site no Google Search Console e enviar o `sitemap.xml` no dia do deploy
- [ ] Revisar com cada corretor o Perfil da Empresa no Google: fotos, horários, link para as páginas e postagens dos imóveis
- [ ] Combinar com o corretor o pedido de avaliação no Google a cada negócio fechado
- [ ] Guardar as perguntas mais frequentes das conversas da bolha: elas viram pauta de conteúdo

**Depois da POC: páginas de bairro.** Uma página por bairro onde o corretor atua, em `/imoveis/victor-konder-blumenau`. Ela não morre quando um imóvel é vendido e acumula autoridade com o tempo. Modelo de estrutura:

| Bloco | Conteúdo | Por que importa |
| --- | --- | --- |
| Título (H1) | "Imóveis à venda no Victor Konder, Blumenau" | Casa com a busca exata |
| Resumo do bairro | 2 a 3 parágrafos escritos com o corretor: perfil, pontos fortes, para quem é | Conteúdo único; texto genérico de IA não ranqueia |
| Imóveis disponíveis | Cards dos imóveis ativos do corretor no bairro, atualizados automaticamente | Mantém a página viva e leva às páginas de imóvel |
| Vida no bairro | Escolas, mercados, saúde, parques e distância do centro, com mapa | Responde o que o comprador pesquisa |
| Faixa de preços | Preços dos imóveis do próprio corretor, com a data | Informação que IAs e Google citam; só dados reais |
| Perguntas frequentes | 4 a 6 perguntas tiradas das conversas da bolha | Aparece em buscas de pergunta e em respostas de IA |
| Sobre o corretor | Foto, CRECI, avaliações e botão da bolha de chat | Confiança e conversão |
| Dados estruturados | `Place`, `FAQPage`, `RealEstateAgent`, `ItemList` dos imóveis | Ajuda Google e IAs a entender a página |

**Conteúdo e links (contínuo):** artigos que respondem dúvidas reais, como "Quanto custa o ITBI em Blumenau?" e "Como usar o FGTS na compra", e links de sites locais (associação comercial, imprensa local, construtoras parceiras). Nunca comprar pacotes de links.

## Critérios de sucesso

A POC passa se, ao fim das 4 semanas, ao menos um corretor tiver visita agendada pelo atendente e dois dos três disserem que pagariam. As metas abaixo são um ponto de partida: ajuste depois da primeira semana de dados.

| Hipótese | Métrica | Meta inicial |
| --- | --- | --- |
| Adoção | Corretores que publicaram e divulgaram ao menos 2 imóveis | 3 de 3 |
| Atendimento | Visitantes da página que abrem conversa | 10% ou mais |
| Atendimento | Conversas que chegam a um pedido de visita | 15% ou mais |
| Qualidade | Respostas erradas ou inventadas na revisão manual das conversas | Zero informação inventada |
| Valor | Visitas agendadas pelo atendente | Ao menos 1 por corretor |
| Valor | Corretores que dizem que pagariam, e quanto | 2 de 3, com valor citado |

Revise todas as conversas manualmente toda semana. Na POC, essa revisão é o teste de qualidade do atendente.

## Piloto com corretores

O piloto é gratuito para 3 corretores autônomos de Blumenau, em troca de feedback semanal e permissão para usar os resultados como caso.

- [ ] Selecionar 3 corretores ativos no Instagram ou em portais, sem site próprio
- [ ] Fazer a demo com um imóvel real de cada um antes do primeiro contato
- [ ] Combinar por escrito: duração, o que é gratuito e como os dados dos compradores são tratados
- [ ] Cadastrar 2 a 3 imóveis por corretor e revisar as descrições com ele
- [ ] Combinar a divulgação: link na bio, status do WhatsApp e, se ele já usa, anúncio no Meta
- [ ] Fazer uma conversa de 15 minutos por semana com cada corretor
- [ ] No fim, perguntar diretamente: "Você pagaria? Quanto?"

## Cronograma

&#91;embedded content: cronograma · 4 semanas, 2 marcos\]

A abordagem aos corretores começa quando a demo fica pronta, no fim da semana 2. Se a semana 1 atrasar, corte SEO avançado, nunca o atendente: é ele que a POC testa.

## Custos estimados

A POC deve custar pouco além do seu tempo: a maior parte cabe em planos gratuitos. Os valores são aproximados e não foram consultados agora; confira os preços atuais antes de contratar.

| Item | Opção sugerida | Custo aproximado na POC |
| --- | --- | --- |
| Hospedagem Next.js | Vercel, Railway ou uma VPS que você já tenha | Gratuito a baixo custo (o plano gratuito da Vercel é para uso não comercial) |
| Banco PostgreSQL | Neon ou Supabase | Plano gratuito |
| Fotos | Cloudflare R2 ou Supabase Storage | Plano gratuito ou centavos |
| Domínio .com.br | Registro.br | Taxa anual do registro |
| Modelo de IA | Modelo de custo baixo com tool calling | Poucos dólares para centenas de conversas |
| E-mail de aviso | Resend ou similar | Plano gratuito |

O custo real é o seu tempo: cerca de 4 semanas de trabalho em horas livres, mais o acompanhamento do piloto.

## Riscos e mitigação

O maior risco é não haver tráfego suficiente para testar o atendente; os outros são controláveis.

| Risco | Mitigação |
| --- | --- |
| Pouco tráfego na página em 4 semanas | Escolher corretores que já divulgam muito; sugerir um anúncio pequeno no Meta apontando para a página |
| Atendente inventa informação | Prompt restrito à ficha, transferência ao corretor e revisão semanal de todas as conversas |
| Comprador prefere WhatsApp ao chat na página | Pedir telefone ou e-mail na bolha antes de confirmar a visita; medir quem fecha a bolha sem responder |
| Corretor não divulga o link | Entregar textos e artes prontos para Instagram e status |
| Dados pessoais dos compradores (LGPD) | Consentimento no chat, política de privacidade e acesso aos dados só para o corretor do imóvel |
| Conflito com seu emprego atual | Verificar cláusulas de exclusividade e não concorrência no contrato; trabalhar só em horário e equipamento pessoais |
