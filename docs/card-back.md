# Cards do backend

Tudo o que falta para tirar o Showing dos dados de exemplo (`USAR_MOCKS=1`) e colocá-lo no ar para o piloto. O frontend está pronto contra mocks; o status dos cards de interface fica em [line-implement.md](line-implement.md) e o escopo original em [cards.md](cards.md).

**Estado em 2026-11-20.** Nada deste arquivo foi feito: as telas, o atendente e a rota `/api/chat` rodam em memória. O que já existe: schema e migration (P-02), seed (P-03), cliente Prisma (P-04), `src/lib/storage.ts` (Appwrite), `src/lib/email.ts` (Nodemailer) e Auth.js com link mágico (A1).

**Legenda:** `A FAZER` · `EM ANDAMENTO` · `PRONTO` · `BLOQUEADO`. **Tamanho:** P (até meio dia) · M (1 dia) · G (2+ dias).

**Regra geral de troca:** as assinaturas das funções não mudam; só se reescreve o corpo trocando o mock por Prisma. Toda consulta filtra por `corretorId` da sessão (RN-23).

---

## Resumo

| Card | Tam. | Status | Depende de |
| --- | --- | --- | --- |
| BK-00 Esquemas do Prisma | P | PRONTO | — |
| BK-01 Ambiente e banco | P | PARCIAL | BK-00 |
| BK-02 Login real (A1) | P | PRONTO | BK-01, BK-07 |
| BK-03 Imóveis, fotos e perfil no Prisma | G | PRONTO | BK-01 |
| BK-04 Atendimento, conversas e visitas no Prisma | G | PRONTO | BK-01, BK-03 |
| BK-05 Métricas no Prisma | P | PRONTO | BK-03, BK-04 |
| BK-06 Fotos no Appwrite | M | PARCIAL | BK-03 |
| BK-07 E-mails de visita e transferência (C5) | M | PRONTO | BK-04 |
| BK-08 Privacidade e LGPD no backend | M | PRONTO | BK-04 |
| BK-09 Atendente em produção (modelo e custo) | M | PARCIAL | BK-04 |
| BK-10 Deploy e qualidade (E3) | M | A FAZER | todos |

Ordem sugerida: BK-01 → BK-03 → BK-04 → BK-06 → BK-07 → BK-02 → BK-05 → BK-08 → BK-09 → BK-10.

---

## BK-00 · Esquemas do Prisma — PRONTO (2026-11-20)

Schema revisado contra o que as telas e o atendente precisam. Nova migration `20261120110948_backend_atendimento` (a `init` ficou intacta), aplicada no Postgres local (`localhost:5433`):
- `Conversa.lidaEm` (marcar transferência como lida) e `Conversa.versao` (controle de concorrência no histórico: `salvarMensagens` só grava se a versão não mudou).
- `Visita.corretorId` (cópia do dono do imóvel, preenchida na migration) para filtrar por dono (RN-23).
- Índice único parcial `Visita(corretorId, dataHora) WHERE status <> 'cancelada'`: dois pedidos no mesmo horário do mesmo corretor falham no banco; cancelada libera o horário. Só em SQL na migration (Prisma não declara índice parcial), então **não rodar `migrate dev` que o regenere sem conferir**. Não cobre sobreposição parcial (visitas de 60 min às 10:00 e 10:30): essa continua na regra de `horarios.ts`.
- Índices novos: `Conversa(imovelId, transferida)`, `Evento(imovelId, criadoEm)`, `Visita(corretorId, dataHora)`.
- Cliente regenerado (`src/generated/prisma`); `typecheck` passa. O resto do schema (User com perfil e horários, Imovel com latitude/longitude, Foto, Evento) já cobria as telas.

## BK-01 · Ambiente e banco — PARCIAL (2026-11-20)

**Feito:**
- Postgres local no ar (`docker-compose.yml`, porta 5433), migrations aplicadas e seed rodado.
- `AUTH_SECRET` gerado no `.env` local (era o que causava `MissingSecret`) e `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- `pnpm env:check` (`scripts/verificar-ambiente.ts`): confere variáveis por grupo (base, site, IA, e-mail, fotos), conexão, migrations e seed, sem imprimir valores; sai com erro se faltar `DATABASE_URL` ou `AUTH_SECRET`. Estado atual: base, site e IA ok; e-mail e fotos faltando.
- Seed aceita `SEED_CORRETOR_EMAIL` (só e-mail cadastrado entra no painel; o padrão `corretor@exemplo.com` não recebe e-mail). `.env.example` atualizado.

**Falta (depende de você):**
- `EMAIL_USER`, `EMAIL_APP_PASSWORD` (senha de app do Gmail) e `EMAIL_FROM_NAME` (BK-07), para o link de login chegar.
- `APPWRITE_*` (BK-06).
- Para entrar no painel de verdade: definir `SEED_CORRETOR_EMAIL` com um e-mail seu, rodar `pnpm prisma db seed` e tirar `USAR_MOCKS=1` do `.env` (BK-02).

**Nota:** `src/lib/imoveis.ts` e o painel ainda leem dos mocks mesmo sem `USAR_MOCKS`; a página pública só passa a ler do banco no BK-03. Por isso o critério de pronto aqui é `pnpm env:check` verde nos grupos ligados ao banco.

## BK-02 · Login real (A1) — PRONTO (2026-11-20)

**Feito:** `USAR_MOCKS` fora do `.env` (comentado), `AUTH_SECRET` definido, e o seed passou a trocar o e-mail do corretor de exemplo por `SEED_CORRETOR_EMAIL` (o corretor do seed é dono do imóvel de exemplo). Verificado em `localhost:3000` sem mocks:
- `/painel` sem sessão responde 307 para `/login`.
- Pedir o link no formulário grava o token em `VerificationToken`, chama o Gmail sem erro e leva a `/login/verificar` ("Veja seu e-mail", reenvio em 60 s), sem erro de console. E-mail desconhecido recebe a mesma resposta.

**Corrigido (laço depois do link):** com sessão JWT o `id` do corretor não ia para a sessão, então `exigirCorretor` não achava o usuário e mandava de volta ao `/login`. `src/auth.ts` ganhou os callbacks `jwt` e `session` que copiam o id. Comprovado com um token de login gerado direto no banco: sem a correção `/painel` manda ao login, com ela renderiza a visão geral.

**Confirmado pelo usuário:** o link do e-mail leva ao `/painel` e o login funciona de ponta a ponta (link mágico por Gmail, sessão JWT, `/painel` protegido).

**Próximos testes reais:** upload de foto pelo painel (BK-06) e uma conversa na bolha com a IA real, vendo a visita no painel e os e-mails chegando.

## BK-03 · Imóveis, fotos e perfil no Prisma — PRONTO (2026-11-20)

Sem `USAR_MOCKS=1` o painel e a página pública leem e gravam no Postgres; com ele (e nos testes) tudo segue em memória. As assinaturas não mudaram, então telas e actions ficaram intactas.
- **Estrutura:** `src/lib/painel/imoveis.ts` e `perfil.ts` viraram despachantes finos (import dinâmico) para `imoveis-db.ts` / `perfil-db.ts` (Prisma) ou `src/mocks/painel-imoveis.ts` / `painel-perfil.ts` (memória, código antigo). `src/lib/imoveis.ts` (leituras públicas) escolhe a fonte do mesmo jeito; `imovelParaPagina` agora é `async`.
- **Regras mantidas no banco:** RN-07 (toda consulta filtra por `corretorId`; imóvel de outro corretor = inexistente), RN-02 (3 fotos para publicar e para remover de um publicado), RN-03 (slug com sufixo, fixo após publicar; repete a tentativa se dois cadastros colidirem no índice único), RN-04 (público só `publicado`/`vendido`), RN-08 (capa = ordem 0, renumeração em transação), RN-25 (excluir apaga fotos do storage; fotos, conversas, visitas e eventos saem em cascata), publicar exige nome e CRECI no perfil.
- **Schema:** migration `20261120113618_imovel_info_bairro` (`Imovel.infoBairro Json?`), para a seção do bairro e o prompt do atendente.
- **Testes:** `imoveis-db.test.ts` (7 casos contra o Postgres local; cria o próprio corretor e limpa tudo; pula sem `DATABASE_URL`). 119 testes passam, mais `typecheck`, `lint` e `build`. Verificado: com o servidor sem mocks, `/imovel/<slug do seed>` e o `sitemap.xml` saem do banco.
- **Testes sem exemplos:** `semearExemplos()` (em `src/lib/mocks.ts`) deixa as conversas e eventos de exemplo só para o desenvolvimento; `vitest.config.ts` define `USAR_MOCKS=1` para os testes de regra.
- **Ainda em memória, mesmo sem `USAR_MOCKS`:** conversas, visitas, clientes e métricas do painel (`atendimentos.ts`, `metricas.ts`, `/api/chat`, `/api/eventos`): BK-04 e BK-05. Até lá o painel sem mocks mostra esses blocos vazios ou de exemplo. O upload de fotos precisa do Appwrite (BK-06) e o painel exige login real (BK-02).

## BK-04 · Atendimento, conversas e visitas no Prisma — PRONTO (2026-11-20)

Sem `USAR_MOCKS=1`, o atendente e o painel de conversas, visitas e clientes usam o Postgres; com ele (e nos testes) segue tudo em memória.
- **Atendente:** `src/lib/ai/repositorio-db.ts` implementa `RepositorioAtendimento`; `repositorio-atual.ts` escolhe a fonte (uma instância Prisma por requisição). Horários e duração vêm do `User` dono do imóvel; `visitasOcupadas` olha as visitas `pedida`/`confirmada` de **todos** os imóveis do corretor (RN-17).
- **Visita:** nasce `pedida` (RN-20). O índice único parcial do BK-00 recusa o mesmo horário do mesmo corretor; a recusa vira `ConflitoDeVisita`, e a ferramenta `agendar_visita` devolve ao modelo "esse horário acabou de ser pedido, ofereça outro" (ou "já existe pedido nesta conversa", RN-19). Cancelada libera o horário.
- **Histórico:** `salvarMensagens` só grava se a `versao` ainda é a lida; senão `ConflitoDeHistorico` e a rota responde o evento de erro (fim do risco de duas respostas se sobrescreverem).
- **Consentimento:** `salvarLead` grava o lead com data e hora; o painel só devolve nome e contato com `consentimento = true` (RN-11, RNF-13).
- **Painel:** `src/lib/painel/atendimentos.ts` virou despachante para `atendimentos-db.ts` (ou `src/mocks/painel-atendimentos.ts`); a lógica de clientes, transições e `contarNaoLidas` ficou compartilhada. Tudo filtra pelo dono do imóvel (RN-23); mudar status usa comparação com o valor lido (sem pular etapa em ações simultâneas); marcar como lida não reordena a lista; nova transferência volta a pedir atenção.
- **Testes:** `repositorio-db.test.ts` (9 casos contra o Postgres: fluxo completo do atendente, horário duplicado, histórico concorrente, RN-11/RN-23, transições). 

## BK-05 · Métricas no Prisma — PRONTO (2026-11-20)

`metricas.ts` virou despachante para `metricas-db.ts` (tabela `Evento`, `groupBy` por tipo e por imóvel, só os últimos N dias; "conversas" = com ao menos uma mensagem do comprador). `registrarEvento` só grava para imóvel que não é rascunho. Sem dado pessoal. 1 teste de integração (dono × outro, período, rascunho).

**Verificação:** 129 testes, `typecheck`, `lint`, `build` e 24 testes de navegador (fumaça, painel e bolha no desktop, sobre os mocks) passam. **Ainda não testado:** o fluxo real pelo navegador (bolha com o modelo de IA gravando no banco e aparecendo no painel): precisa do login real (BK-02) para ver o painel.

## BK-06 · Fotos no Appwrite — PARCIAL (2026-11-20)

**Feito:** Appwrite **self-hosted** em `https://appwrite.foliumdev.com.br/v1` (o `cloud.appwrite.io` dava `project_not_found`). `pnpm tsx scripts/test-appwrite.ts` envia `e2e/fixtures/foto.png`, abre a URL pública (200, `image/png`) e apaga o arquivo: envio, leitura e remoção funcionam. O host do Appwrite entra em `images.remotePatterns` (`next.config.ts`, a partir de `APPWRITE_ENDPOINT`, caminho `/v1/storage/**`).

**Falta:**
- Testar `POST /api/upload` de ponta a ponta (imóvel e perfil, apagando a foto anterior) e ver a foto renderizada por `next/image`; depende do login real (BK-02) ou de `USAR_MOCKS=1` com `STORAGE_LOCAL` desligado.
- O servidor é 1.8.0 e o SDK `node-appwrite@32.0.0` é feito para 2.7.2: avisa no log, mas funcionou; se aparecer incompatibilidade, baixar o SDK para a versão da 1.8.
- Reiniciar o `pnpm dev` depois de mudar o `.env`, porque o `next.config.ts` lê o endpoint ao subir.

## BK-07 · E-mails de visita e transferência (C5) — PRONTO (2026-11-20)

Nodemailer com Gmail (senha de app), só com `EMAIL_USER`, `EMAIL_APP_PASSWORD` e `EMAIL_FROM_NAME`. Sem camada `IEmailService`: `enviarEmail()` em `src/lib/email.ts` é o único ponto de envio (trocar de provedor = mexer só em `criarTransporte()`).
- **Templates** (`src/emails/`, React Email, layout comum em `Moldura.tsx`; o React escapa o texto dinâmico): `visita-pedida` (corretor), `conversa-transferida` (corretor), `pedido-recebido` (comprador) e `visita-atualizada` (comprador: confirmada ou cancelada).
- **Quem recebe o quê** (`src/lib/notificacoes.ts`): visita pedida → corretor, e comprador se deixou e-mail; transferência → corretor, com o motivo; confirmar ou cancelar no painel → comprador, se tem e-mail. O contato só entra se houve consentimento (RN-11).
- **Disparo:** `agendar_visita` e `transferir_corretor` chamam ganchos opcionais (`aoPedirVisita`, `aoTransferir`) **depois de salvar**, sem `await`; a ação de status do painel faz o mesmo. Falha de envio nunca desfaz nem quebra a operação, e o log leva só o tipo do erro.
- **Liga e desliga:** `notificacoesAtivas()` = e-mail configurado e fora do `USAR_MOCKS`. Sem as variáveis o sistema roda sem enviar.
- **Testes:** `notificacoes.test.ts` (8): renderização e escape de HTML, ganchos chamados só no sucesso, falha de envio sem quebrar a visita nem vazar e-mail no log, e envio com dados do Postgres (destinatários, fuso de São Paulo, sem consentimento = sem contato). 137 testes, `typecheck`, `lint` e `build` passam.
- **Teste real:** `pnpm tsx scripts/test-email.ts <seu-email>` envia os 4 e-mails de exemplo; os 4 saíram para a caixa de teste em 2026-11-20.
- **Limites:** envio único, sem reenvio automático (RNF-20); o Gmail limita cerca de 500 por dia, suficiente para o piloto. Em hospedagem serverless o envio sem `await` pode ser cortado quando a resposta termina: se for o caso, trocar `disparar()` por `after()` do Next.

## BK-08 · Privacidade e LGPD no backend — PRONTO (2026-11-20)

- **Anonimização (RN-24):** `anonimizarConversa` apaga `perfilLead`, o consentimento (e sua data) e tira nome, e-mail e telefone do texto das mensagens e do motivo da transferência (`src/lib/lgpd.ts`: e-mail, telefone em vários formatos e o nome informado, inteiro ou por partes; os argumentos de `registrar_lead` no histórico do agente são esvaziados). A conversa e as visitas ficam, sem identificar o comprador; nova coluna `Conversa.anonimizadaEm` (migration `20261120123442_conversa_anonimizada`) e `versao` incrementada para uma resposta em andamento não desfazer a limpeza. Preço, área e palavras parecidas com o nome não são tocados.
- **Pedido do comprador:** ele escreve para o contato da `/privacidade` (ou para o corretor) e o corretor executa no painel: botão **Excluir dados do comprador** na conversa (uma conversa) e na página do cliente (todas as conversas do mesmo telefone ou e-mail), com confirmação. Só conversas de imóveis dele (RN-23).
- **Prazo de guarda:** padrão de **180 dias sem atividade** (`RETENCAO_DIAS` muda; a `/privacidade` mostra o valor configurado). `aplicarRetencao` anonimiza o que passou do prazo, poupa conversa com visita ainda pedida ou confirmada, e é idempotente. Roda por `pnpm retencao` ou por `POST /api/cron/retencao` com `Authorization: Bearer <CRON_SECRET>` (sem `CRON_SECRET` a rota responde 404); agendar uma chamada diária no deploy (BK-10).
- **Logs:** conferido: os 3 `console.error` e o `console.info` da retenção levam só tipo de erro ou contagem.
- **Testes:** `lgpd.test.ts` (redação, prazo, pedido de exclusão em memória) e 2 de integração com o Postgres (pedido e prazo de guarda, só com dados do próprio teste). 145 testes, `typecheck`, `lint` e `build` passam; e2e do painel passa.

**Decisão sua:** o prazo de 180 dias é um valor inicial meu, escolhido por ser curto para um piloto de 4 semanas; mude `RETENCAO_DIAS` se preferir outro. **Ainda falta** a revisão do texto da `/privacidade` por uma pessoa de confiança antes do piloto (RNF-14) e definir `NEXT_PUBLIC_EMAIL_PRIVACIDADE`.

## BK-09a · Ferramentas do atendente (spec do produto) — PRONTO (2026-11-20)

As 4 tools passaram a seguir o spec: `consultar_horarios` (até 6 horários com `slot_id`, `dia` e `hora`; `a_partir_de` opcional; sem horário: "Sem horários livres nos próximos dias"), `pedir_visita` (`slot_id`, `nome`, `telefone`, `forma_pagamento` e `observacao` opcionais; a visita nasce `pedida` e a resposta nunca diz "confirmada"; "Horário ocupado, consulte os horários de novo."), `salvar_contato` (campos opcionais, ao menos um; "Contato salvo") e `transferir_para_corretor` (`motivo`: sem_resposta, pedido_do_comprador, negociacao ou reclamacao, mais `resumo`; "Conversa transferida para [corretor]"). Substituem `listar_horarios`, `registrar_lead`, `agendar_visita` e `transferir_corretor`.
- **Consentimento (RN-11) fora do modelo:** os botões "Pode guardar" / "Prefiro não" mandam `consentimento: "aceito" | "recusado"` no POST `/api/chat`; o servidor grava o aceite (com data e hora) antes do modelo responder. Sem aceite, `salvar_contato` e `pedir_visita` não gravam nada e o modelo recebe uma instrução para pedir que o comprador toque no botão. Recusar desliga o aceite. Antes o modelo passava `consentimento = true`.
- **slot_id** = dia e hora de Brasília (`20261121-0900`); a tool confere contra os horários livres no momento do pedido (RN-17, RN-18), então um id inventado ou já ocupado é recusado.
- **Sem `imovel_id`:** as tools nascem presas ao imóvel e à conversa. O resumo e o motivo da transferência vão para o corretor como "Pergunta sem resposta na ficha: …"; `interesse` e `observacao` ficam no lead e na visita.
- **Prompt, bolha e rota:** prompt reescrito (inclui o que fazer quando o comprador "autoriza" digitando), a rota mostra os botões também quando o atendente pede o toque, e `contato_capturado` é contado uma vez por conversa. `maxTokens` 3000 e `reasoning: low` (OpenRouter), porque o modelo atual estourava o limite só raciocinando e devolvia resposta vazia.
- **Testes:** 152 unitários e de integração; **8 casos ao vivo passaram duas vezes seguidas**, incluindo o fluxo completo (horários → aceite pelo botão → visita pedida) e o de horário inventado.

## BK-09 · Atendente em produção (modelo e custo) — PARCIAL (2026-11-20)

**Feito**
- **Medição de gasto:** tabela `UsoIA` (migration `20261120131902_uso_ia`) com tipo (`chat` ou `descricao`), modelo, imóvel e **só contagens de tokens**, sem texto nem dado pessoal; cada resposta do atendente e cada descrição gerada registram o uso (`src/lib/ai/uso.ts`). Uma falha ao registrar nunca derruba a conversa.
- **`pnpm custo [dias]`:** relatório semanal (mensagens, descrições, tokens de entrada e saída, US$ estimado e média por mensagem). Para o valor em dólar, preencha `AI_PRECO_ENTRADA` e `AI_PRECO_SAIDA` (US$ por 1 milhão de tokens, em openrouter.ai/models).
- **Teto diário:** `AI_LIMITE_DIARIO` (padrão **300 mensagens** do atendente nas últimas 24 h). Passou do teto, a rota responde 503 e a bolha cai no atendente simulado, sem chamar o modelo.
- **Título e descrição pelo modelo:** `gerarTituloEDescricao` chama a IA (JSON validado com Zod) e **só aceita o texto se todo número estiver na ficha e não houver preço**; se a IA falhar, vier fora do formato ou inventar algo, usa o texto padrão da ficha (RN-06: continua rascunho editável). Testado com modelo falso (inclui invenção de quartos, área e preço) e uma vez com o modelo real.
- **Número real medido** (modelo atual, 3 mensagens de uma conversa): entrada de 2.200 a 5.300 tokens e saída de 150 a 400 por mensagem, porque o prompt com a ficha vai a cada chamada e o histórico cresce. Com o teto de 300 mensagens por dia, o pior caso é da ordem de 1,5 milhão de tokens de entrada por dia; multiplique pelo preço do modelo escolhido.
- 160 testes, `typecheck`, `lint` e `build` passam.

**Falta**
- **Reiniciar o `pnpm dev`:** o cliente do Prisma foi regenerado com a tabela nova e o servidor aberto ainda não a enxerga (o uso só passa a ser gravado depois do restart).
- **Decisão sua: modelo e preço.** O modelo atual é `google/gemini-4-neon`; para trocar, compare custo e qualidade rodando `pnpm vitest run atendente.live` com cada `AI_MODEL`, e preencha `AI_PRECO_*` para o relatório mostrar o gasto. Revisar o relatório toda semana do piloto.
- **Limite por minuto (RNF-10) continua em memória**, uma instância só. Com hospedagem que sobe várias instâncias (serverless), o teto diário protege o orçamento mesmo assim, mas o limite por IP precisa de armazenamento compartilhado: decidir no BK-10.

## BK-10 · Deploy e qualidade (E3) — M

- Fixar as versões das dependências, em especial `@strands-agents/sdk`.
- Deploy com variáveis de ambiente; `USAR_MOCKS` nunca em produção (já é ignorada fora de desenvolvimento).
- Lighthouse mobile ≥ 90 em desempenho e SEO em `/` e `/imovel/[slug]`.
- Slug inexistente responde 200 com `noindex`, não 404 (limitação do streaming com Cache Components): reavaliar.
- Fotos de exemplo do Unsplash trocadas por fotos reais antes de qualquer demonstração.
