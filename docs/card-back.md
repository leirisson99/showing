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
| BK-04 Atendimento, conversas e visitas no Prisma | G | PRONTO | BK-01, BK-03 |
| BK-05 Métricas no Prisma | P | PRONTO | BK-03, BK-04 |
| BK-06 Fotos no Appwrite | M | PARCIAL | BK-03 |
| BK-07 E-mails de visita e transferência (C5) | M | PRONTO | BK-04 |
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
