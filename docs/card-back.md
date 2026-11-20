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
| BK-02 Login real (A1) | P | A FAZER | BK-01, BK-07 |
| BK-03 Imóveis, fotos e perfil no Prisma | G | PRONTO | BK-01 |
| BK-04 Atendimento, conversas e visitas no Prisma | G | A FAZER | BK-01, BK-03 |
| BK-05 Métricas no Prisma | P | A FAZER | BK-03, BK-04 |
| BK-06 Fotos no Appwrite | M | PARCIAL | BK-03 |
| BK-07 E-mails de visita e transferência (C5) | M | A FAZER | BK-04 |
| BK-08 Privacidade e LGPD no backend | M | A FAZER | BK-04 |
| BK-09 Atendente em produção (modelo e custo) | M | A FAZER | BK-04 |
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

## BK-02 · Login real (A1) — P

Código já feito (Auth.js, provider de e-mail, `proxy.ts`, `/login`, `/login/verificar`, `exigirCorretor()`). **Falta o teste ponta a ponta:** pedir o link, receber o e-mail, entrar, sair.
- Só e-mail de corretor já cadastrado entra; a resposta é igual para e-mail desconhecido.
- `enviarLink` já captura falha de envio; conferir a mensagem mostrada ao usuário.
- **Pronto quando:** o fluxo completo funciona com banco e e-mail reais e `/painel` sem sessão redireciona para `/login`.

## BK-03 · Imóveis, fotos e perfil no Prisma — PRONTO (2026-11-20)

Sem `USAR_MOCKS=1` o painel e a página pública leem e gravam no Postgres; com ele (e nos testes) tudo segue em memória. As assinaturas não mudaram, então telas e actions ficaram intactas.
- **Estrutura:** `src/lib/painel/imoveis.ts` e `perfil.ts` viraram despachantes finos (import dinâmico) para `imoveis-db.ts` / `perfil-db.ts` (Prisma) ou `src/mocks/painel-imoveis.ts` / `painel-perfil.ts` (memória, código antigo). `src/lib/imoveis.ts` (leituras públicas) escolhe a fonte do mesmo jeito; `imovelParaPagina` agora é `async`.
- **Regras mantidas no banco:** RN-07 (toda consulta filtra por `corretorId`; imóvel de outro corretor = inexistente), RN-02 (3 fotos para publicar e para remover de um publicado), RN-03 (slug com sufixo, fixo após publicar; repete a tentativa se dois cadastros colidirem no índice único), RN-04 (público só `publicado`/`vendido`), RN-08 (capa = ordem 0, renumeração em transação), RN-25 (excluir apaga fotos do storage; fotos, conversas, visitas e eventos saem em cascata), publicar exige nome e CRECI no perfil.
- **Schema:** migration `20261120113618_imovel_info_bairro` (`Imovel.infoBairro Json?`), para a seção do bairro e o prompt do atendente.
- **Testes:** `imoveis-db.test.ts` (7 casos contra o Postgres local; cria o próprio corretor e limpa tudo; pula sem `DATABASE_URL`). 119 testes passam, mais `typecheck`, `lint` e `build`. Verificado: com o servidor sem mocks, `/imovel/<slug do seed>` e o `sitemap.xml` saem do banco.
- **Testes sem exemplos:** `semearExemplos()` (em `src/lib/mocks.ts`) deixa as conversas e eventos de exemplo só para o desenvolvimento; `vitest.config.ts` define `USAR_MOCKS=1` para os testes de regra.
- **Ainda em memória, mesmo sem `USAR_MOCKS`:** conversas, visitas, clientes e métricas do painel (`atendimentos.ts`, `metricas.ts`, `/api/chat`, `/api/eventos`): BK-04 e BK-05. Até lá o painel sem mocks mostra esses blocos vazios ou de exemplo. O upload de fotos precisa do Appwrite (BK-06) e o painel exige login real (BK-02).

## BK-04 · Atendimento, conversas e visitas no Prisma — G

- Implementar `RepositorioAtendimento` (`src/lib/ai/repositorio.ts`) com Prisma e trocar em `src/lib/ai/repositorio-atual.ts`; substituir `src/mocks/atendimento.ts`.
- `src/lib/painel/atendimentos.ts`: visitas, conversas, clientes, `marcarConversaLida`, `contarNaoLidas`. Pode exigir campo novo (`lidaEm`) no `Conversa`: migration.
- **Visita:** proteção contra duas visitas no mesmo horário (índice único ou transação), RN-17 a RN-20; cancelada libera o horário.
- **Histórico da conversa:** hoje duas mensagens simultâneas na mesma conversa podem sobrescrever o histórico; salvar com controle de concorrência.
- Nome e contato só são gravados depois do consentimento (RN-11).
- **Pronto quando:** `pnpm vitest run` com a suíte do atendente passa contra o banco e uma conversa real gera visita visível em `/painel/visitas`.

## BK-05 · Métricas no Prisma — P

- Gravar e agregar na tabela `Evento` (`src/lib/painel/metricas.ts`, `POST /api/eventos`, eventos de `/api/chat`).
- Sem dado pessoal no evento; a pré-visualização do corretor não conta.
- **Pronto quando:** os 4 números da visão geral e as colunas da lista de imóveis vêm do banco.

## BK-06 · Fotos no Appwrite — PARCIAL (2026-11-20)

**Feito:** Appwrite **self-hosted** em `https://appwrite.foliumdev.com.br/v1` (o `cloud.appwrite.io` dava `project_not_found`). `pnpm tsx scripts/test-appwrite.ts` envia `e2e/fixtures/foto.png`, abre a URL pública (200, `image/png`) e apaga o arquivo: envio, leitura e remoção funcionam. O host do Appwrite entra em `images.remotePatterns` (`next.config.ts`, a partir de `APPWRITE_ENDPOINT`, caminho `/v1/storage/**`).

**Falta:**
- Testar `POST /api/upload` de ponta a ponta (imóvel e perfil, apagando a foto anterior) e ver a foto renderizada por `next/image`; depende do login real (BK-02) ou de `USAR_MOCKS=1` com `STORAGE_LOCAL` desligado.
- O servidor é 1.8.0 e o SDK `node-appwrite@32.0.0` é feito para 2.7.2: avisa no log, mas funcionou; se aparecer incompatibilidade, baixar o SDK para a versão da 1.8.
- Reiniciar o `pnpm dev` depois de mudar o `.env`, porque o `next.config.ts` lê o endpoint ao subir.

## BK-07 · E-mails de visita e transferência (C5) — M

**Como funciona (decidido em 2026-11-20):** Nodemailer com Gmail (senha de app), em e-mails transacionais disparados por *hooks opcionais*, sem acoplar a regra de negócio ao envio.

**Adaptações ao projeto** (o modelo original era de outra base de código):
- **Só três variáveis:** `EMAIL_USER` (conta Gmail), `EMAIL_APP_PASSWORD` (senha de app: Conta Google → Segurança → Verificação em duas etapas → Senhas de app; nunca a senha normal) e `EMAIL_FROM_NAME` (nome do remetente). Substituem `SMTP_*` e `EMAIL_FROM`. `src/lib/email.ts` usa `nodemailer.createTransport({ service: "gmail" })` e exporta `emailConfigurado()`. Só no `.env`, que está no `.gitignore`.
- **Sem camada `IEmailService`:** `enviarEmail({ para, assunto, template })` já é o único ponto de envio, então trocar o Gmail por outro provedor é mexer só em `criarTransporte()`. Não criar interface nem injeção de dependência (CLAUDE.md: sem abstração na POC).
- **Templates em React Email** (`src/emails/`, padrão do `link-de-acesso.tsx`), no lugar de `buildHtml` à mão: já geram layout em tabelas com estilos inline e escapam o conteúdo dinâmico. Preço com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })` (já em `src/lib/format.ts`).

**Eventos e textos** (mapa `{ assunto, título, texto }` por evento; evento sem configuração é ignorado):
| Evento | Para | Conteúdo |
| --- | --- | --- |
| Visita pedida | corretor | imóvel, data e hora, nome e contato do comprador, dúvidas pendentes, link para `/painel/visitas` |
| Conversa transferida | corretor | motivo, imóvel, link para a conversa |
| Pedido recebido | comprador (se deixou e-mail e autorizou) | imóvel, data e hora, "o corretor vai confirmar com você" |
| Visita confirmada / cancelada | comprador (se tem e-mail) | imóvel, data e hora, contato do corretor |

**Disparo:**
- `agendar_visita`, `transferir_corretor` e as ações de visita do painel recebem um **callback opcional** (`aoPedirVisita`, `aoTransferir`, `aoMudarStatusDaVisita`). Depois de persistir, chamam sem `await`: `callback(dados).catch((e) => console.error("falha ao enviar e-mail", e.name))`. **A visita é salva antes do e-mail; falha de envio nunca quebra nem desfaz a operação.**
- O log leva só o tipo do erro, nunca endereço, nome ou texto da mensagem (LGPD).
- Ligação em um único ponto (ex.: `src/lib/notificacoes.ts`): `emailConfigurado()` (`EMAIL_USER` e `EMAIL_APP_PASSWORD`); se faltar variável o callback fica `undefined` e o sistema roda sem enviar (dev, CI e `USAR_MOCKS`).
- Reenvio em caso de falha (RNF-20): fora do primeiro corte; começar com a tentativa única registrada em log.
- Gmail limita cerca de 500 envios por dia em conta pessoal: suficiente para o piloto de 3 corretores.

**Teste isolado:** `scripts/test-email.ts` renderiza cada template e envia ao seu próprio e-mail, rodado com `pnpm tsx scripts/test-email.ts`. Conferir também a caixa de spam antes de ligar aos fluxos.

**Pronto quando:** um pedido de visita pela bolha chega por e-mail ao corretor com contato, horário e dúvidas pendentes; testes de renderização (`render()` contém os campos) passam; derrubar o SMTP não impede a visita de ser salva.

## BK-08 · Privacidade e LGPD no backend — M

- Definir o prazo de guarda dos dados do comprador e aplicar (job ou rotina de limpeza).
- Exclusão a pedido (RN-24): apagar conversa, lead e visita do comprador.
- Revisão do texto de `/privacidade` por uma pessoa de confiança antes do piloto (RNF-14); definir `NEXT_PUBLIC_EMAIL_PRIVACIDADE`.
- Conferir que nenhum dado pessoal vai para log ou analytics.

## BK-09 · Atendente em produção (modelo e custo) — M

- Escolher o modelo (`AI_MODEL`) e fixar o provedor (`AI_BASE_URL`, OpenRouter hoje); acompanhar o custo toda semana.
- Limite de taxa (RNF-10) hoje é em memória e vale para uma instância: mover para o banco ou um armazenamento compartilhado se houver mais de uma.
- Rodar `pnpm vitest run atendente.live` depois do consentimento "Pode guardar / Prefiro não" e antes de cada mudança no prompt (custa tokens).
- Trocar a geração de título e descrição (`src/lib/ai/descricao.ts`, hoje um texto fixo) pela chamada ao modelo, com a mesma entrada e saída (RN-06: nada é publicado sozinho).

## BK-10 · Deploy e qualidade (E3) — M

- Fixar as versões das dependências, em especial `@strands-agents/sdk`.
- Deploy com variáveis de ambiente; `USAR_MOCKS` nunca em produção (já é ignorada fora de desenvolvimento).
- Lighthouse mobile ≥ 90 em desempenho e SEO em `/` e `/imovel/[slug]`.
- Slug inexistente responde 200 com `noindex`, não 404 (limitação do streaming com Cache Components): reavaliar.
- Fotos de exemplo do Unsplash trocadas por fotos reais antes de qualquer demonstração.
