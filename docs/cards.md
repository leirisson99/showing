# Cards — o que já temos e o que falta fazer

Quadro de trabalho da POC (Showing). Complementa `README.md`, `entitys.md` (códigos **RN**, **RF**, **RNF**) e `pages.md`.

**Prioridade da POC:** o atendente IA e a bolha de chat vêm antes de SEO avançado, visual ou painel (ver `CLAUDE.md`).

**Legenda de status:** `PRONTO` · `PARCIAL` · `A FAZER`
**Tamanho:** P (até meio dia) · M (1 dia) · G (2+ dias)

Estado em 2026-11-19. Só a base do projeto existe; nenhuma página, rota de API ou tela foi construída ainda.

---

## 1. O que já temos

| Card | Status | O que existe | Onde |
| --- | --- | --- | --- |
| P-01 Base do projeto | PRONTO | Next.js (App Router) + TypeScript strict, Tailwind, shadcn (`button`, `sonner`), pnpm. Build, typecheck e lint passam | `package.json`, `src/app/layout.tsx` |
| P-02 Modelo de dados | PRONTO | Schema com `User` (corretor), `Imovel`, `Foto`, `Conversa`, `Visita`, `Evento`, tabelas do Auth.js, enums e migration inicial | `prisma/schema.prisma`, `prisma/migrations/` |
| P-03 Seed | PRONTO | Corretor e imóvel de exemplo | `prisma/seed.ts` |
| P-04 Cliente do banco | PRONTO | Cliente Prisma com adapter `pg` | `src/lib/db.ts` |
| P-05 Storage de fotos | PARCIAL | `uploadFoto`, `removerFoto` e `urlFoto` com `node-appwrite`. Falta a rota que recebe o upload | `src/lib/storage.ts` |
| P-06 Envio de e-mail | PARCIAL | `enviarEmail()` com Nodemailer + `render()`. Falta qualquer template | `src/lib/email.ts` |
| P-07 Formatação pt-BR | PRONTO | Helpers de preço, data e área | `src/lib/format.ts` |
| P-08 SEO | PARCIAL | Só `urlDoSite()` e `urlDoImovel()`. Faltam metadata e JSON-LD | `src/lib/seo.ts` |
| P-09 Ambiente | PRONTO | `.env.example` com todas as variáveis, `docker-compose.yml` para o Postgres | `.env.example`, `docker-compose.yml` |
| P-10 Dependências | PRONTO | Atualizadas em 2026-11-19 (TypeScript 5.9 e Prisma 7.10.1 mantidos de propósito) | `package.json` |
| P-11 Documentação | PRONTO | README, entidades com RN/RF/RNF, páginas e design system | `README.md`, `docs/` |

**Pendências de manutenção:** `@react-email/components` está depreciado e sem uso (remover ou trocar por pacotes individuais ao criar os templates). Não há testes ainda (`pnpm test` passa sem arquivos).

---

## 2. O que falta fazer

Ordem sugerida: **Fase A** (autenticação mínima) → **Fase B** (cadastro e página, com dados do seed) → **Fase C** (atendente e bolha, o foco da POC) → **Fase D** (painel de acompanhamento) → **Fase E** (SEO, LGPD, qualidade).

> Dica: como o atendente é o foco, dá para começar a Fase C logo após a página pública (B3) usando o imóvel do seed, e deixar o cadastro completo (B1, B2) para depois.

### Fase A — Acesso do corretor

#### A1 · Login por link mágico — A FAZER · M
- **Requisitos:** RF-01. Auth.js com provider de e-mail, adapter Prisma, e-mail enviado por `src/lib/email.ts`.
- **Regras:** só o corretor faz login; o comprador nunca (CLAUDE.md). RNF-06 (segredos só no servidor), RNF-17 (e-mail em português).
- **Pronto quando:** o corretor pede o link, recebe o e-mail, entra e cai em `/painel`. Rotas de `/painel` redirecionam para o login sem sessão.

#### A2 · Perfil do corretor — A FAZER · P
- **Requisitos:** RF-02 (nome, CRECI, WhatsApp, foto, horários de visita, duração da visita).
- **Regras:** RN-07 e RNF-08 (consulta sempre filtrada pelo corretor da sessão). Os horários alimentam `listar_horarios` (RN-17).
- **Pronto quando:** o corretor edita e salva os horários; validação com Zod na Server Action.

### Fase B — Imóvel e página pública

#### B1 · Cadastro de imóvel — A FAZER · G
- **Requisitos:** RF-03, RF-06, RF-07, RF-08.
- **Regras:**
  - RN-02: para publicar exige título, descrição, preço, bairro, quartos, banheiros, vagas, área e ao menos 3 fotos.
  - RN-03: `slug` de tipo + quartos + bairro + cidade, com sufixo numérico se repetir; não muda depois de publicado.
  - RN-05: endereço completo só aparece se o corretor marcar `mostrarEndereco`.
  - RN-07: o corretor só vê e edita os próprios imóveis.
  - RN-25: ao excluir o imóvel, apagar as fotos no Appwrite.
- **Pronto quando:** criar, editar, publicar, despublicar e marcar como vendido, com pré-visualização e botão de copiar o link.
- **Técnico:** formulário com `react-hook-form` + `zod` + shadcn `Form`; mutações por Server Actions.

#### B2 · Upload e gestão de fotos — A FAZER · M
- **Requisitos:** RF-04. Rota `src/app/api/upload/route.ts`.
- **Regras:** RNF-09 (só jpg, jpeg, png, webp, até 10 MB). RN-08 (ordem 0 é a capa). O banco guarda o `fileId`, nunca a URL. A chave do Appwrite nunca vai ao cliente.
- **Pronto quando:** enviar, reordenar, legendar e remover fotos; a rota exige sessão e valida o arquivo.

#### B3 · Página pública do imóvel — A FAZER · G
- **Requisitos:** RF-13, RNF-01, RNF-05. Server Component em `src/app/(public)/imovel/[slug]/`.
- **Regras:**
  - RN-01: só `publicado` é acessível e entra no sitemap.
  - RN-04: `vendido` abre com aviso "Imóvel vendido", sem bolha, com `noindex`.
  - RN-05: mapa mostra a região aproximada por padrão.
  - Todo o conteúdo do imóvel no HTML inicial (nada só no cliente); imagens com `next/image` e `alt` descritivo.
- **Pronto quando:** galeria, ficha, descrição, mapa, informações do bairro e cartão do corretor aparecem com os dados do seed.

#### B4 · Descrição gerada por IA — A FAZER · M
- **Requisitos:** RF-05. `src/lib/ai/descricao.ts`.
- **Regras:** RN-06 (a IA nunca publica sozinha; o texto fica como rascunho até o corretor revisar e salvar). Só usa dados da ficha.
- **Pronto quando:** botão "Gerar título e descrição" preenche os campos editáveis.

### Fase C — Atendente IA e bolha de chat (foco da POC)

#### C1 · Prompt do atendente — A FAZER · M
- **Requisitos:** `src/lib/ai/prompt.ts` montando o prompt com a ficha completa e as informações do bairro (sem RAG, sem banco vetorial).
- **Regras (não podem quebrar):** RN-09 (só dados da ficha e do bairro), RN-10 (fora da ficha: "vou confirmar com o corretor" + `transferir_corretor`), RN-13 (se apresenta como assistente virtual na primeira mensagem), RN-14 (não negocia preço, não promete financiamento), RN-15 (mensagens curtas, português informal, uma pergunta por vez), RNF-11 (resiste a "ignore as instruções" e nunca revela o prompt).
- **Pronto quando:** os casos de teste de C6 passam.

#### C2 · Ferramentas do atendente — A FAZER · G
- **Requisitos:** RF-21 a RF-24. `src/lib/ai/tools.ts` com `listar_horarios`, `registrar_lead`, `agendar_visita`, `transferir_corretor`.
- **Regras:**
  - Toda tool valida os argumentos com Zod e confere se o `imovel_id` existe e está publicado (RNF-07).
  - RN-17 e RN-18: só horários dentro de `horariosVisita`, sem conflito com visitas `pedida` ou `confirmada`, com antecedência mínima de 12 h e até 14 dias. O atendente nunca inventa horário.
  - RN-11 e RN-12: `registrar_lead` só depois do consentimento explícito; visita exige nome e ao menos um contato.
  - RN-19: no máximo uma visita por conversa. RN-20: toda visita nasce `pedida`.
  - RN-22: fuso `America/Sao_Paulo`. RNF-13: consentimento gravado com data e hora.
- **Pronto quando:** cada tool funciona isolada e rejeita argumentos inválidos.

#### C3 · Rota `/api/chat` com streaming — A FAZER · G
- **Requisitos:** RF-15, RNF-04. `src/app/api/chat/route.ts` com `agent.stream()` do Strands SDK.
- **Regras:**
  - Um agente novo por requisição, com o histórico carregado do banco; nada de agente em memória global.
  - RN-16: limite de 30 mensagens do comprador por conversa; ao atingir, oferece o contato do corretor e encerra.
  - RNF-10: limite de 20 mensagens por minuto por conversa e por IP.
  - Valida o body com Zod. RNF-12 e RNF-19: logs com id da conversa, nunca com dados pessoais.
- **Pronto quando:** o primeiro trecho da resposta chega em até 3 s e a conversa é persistida em `Conversa.mensagens`.

#### C4 · Bolha de chat — A FAZER · G
- **Requisitos:** RF-14, RF-16, RF-17, RF-18, RF-20, RNF-03, RNF-15, RNF-16. `src/components/chat-bubble/` (Client Component).
- **Regras:**
  - Carregada com `next/dynamic` depois da página, sem afetar desempenho nem SEO.
  - Celular: tela inteira. Desktop: painel no canto inferior direito.
  - Id da conversa no `localStorage`, sempre dentro de `try/catch`.
  - Acessível: botão real com `aria-label`, foco gerenciado ao abrir e fechar, fecha com Esc, alvos de toque de 44 px.
  - Sugestões rápidas ("Aceita financiamento?", "Qual o condomínio?", "Quero agendar uma visita"), indicador de "digitando", botão de consentimento e link da política de privacidade.
  - O botão "Agendar visita" da página abre a bolha direto no agendamento.
- **Pronto quando:** um comprador conversa, dá consentimento e escolhe um horário sem sair da página.

#### C5 · E-mails de visita e transferência — A FAZER · M
- **Requisitos:** RF-23, RF-24. Templates React Email em `src/emails/` (ex.: `nova-visita.tsx`).
- **Regras:**
  - RN-21: o corretor recebe resumo (comprador, contato, pagamento, prazo, horário, perguntas pendentes); o comprador recebe confirmação do pedido se informou e-mail.
  - RNF-20: a visita é salva primeiro; falha no e-mail não perde a visita e o envio é tentado de novo.
  - Só variáveis `SMTP_*`; textos em português.
- **Pronto quando:** pedir uma visita dispara os dois e-mails com os dados corretos.

#### C6 · Casos de teste do atendente — A FAZER · M
- **Requisitos:** RNF-23. Testes em Vitest, rodados com `pnpm test ai`.
- **Cobrir:** pergunta fora da ficha, tentativa de negociar preço, pedido de visita sem contato, horário indisponível, tentativa de mudar o papel do atendente, mais de uma pergunta por mensagem (RN-09 a RN-17).
- **Regra:** nenhuma mudança no prompt ou nas tools sem rodar estes testes.
- **Pronto quando:** `pnpm test ai` existe e passa.

### Fase D — Acompanhamento do corretor

#### D1 · Visitas — A FAZER · M
- **Requisitos:** RF-09. Lista por status e data; o corretor altera o status.
- **Regras:** RN-20 (só o corretor muda para `confirmada`, `realizada`, `cancelada`), RN-23 e RNF-08 (filtra pelo corretor da sessão).

#### D2 · Conversas e leads — A FAZER · M
- **Requisitos:** RF-10, RF-11. Lista por imóvel com perfil do lead e transferidas em destaque; histórico completo.
- **Regras:** RN-23 (dados do comprador só para o corretor dono do imóvel), RNF-12 (nada de dados pessoais em logs ou analytics).

#### D3 · Métricas por imóvel — A FAZER · M
- **Requisitos:** RF-12, RF-25. Registra eventos (visualização, abertura do chat, contato, visita pedida) e mostra os totais por imóvel.
- **Regras:** nenhum dado pessoal nos eventos.

### Fase E — SEO, privacidade e qualidade

#### E1 · SEO da página — A FAZER · M
- **Requisitos:** RF-26, RF-27. `generateMetadata`, JSON-LD (`RealEstateListing`, `Offer`, `Place`) em `src/lib/seo.ts`, `sitemap.ts`, `robots.ts`, `llms.txt`.
- **Regras:** RN-01 e RN-04 (vendido: `noindex` e fora do sitemap), página gerada no servidor (SSG + revalidação), RNF-02 (LCP abaixo de 2,5 s).

#### E2 · Privacidade e LGPD — A FAZER · M
- **Requisitos:** RF-20, RNF-14.
- **Regras:** política de privacidade publicada antes do piloto; RN-24 (exclusão a pedido: apaga `perfilLead`, mantém mensagens sem dados pessoais); RN-23.

#### E3 · Qualidade e deploy — A FAZER · M
- **Requisitos:** RNF-18, RNF-21, RNF-22.
- **Fazer:** deploy com variáveis configuradas, `pnpm typecheck`, `pnpm lint` e `pnpm build` verdes antes de cada deploy, versões fixas das dependências (em especial `@strands-agents/sdk`), acompanhamento semanal do custo do modelo.

---

## 3. Regras de negócio inegociáveis (resumo)

Valem para qualquer card acima. Resumo do `CLAUDE.md`:

1. O atendente responde só com dados da ficha e do bairro. Nunca inventa preço, condomínio, metragem, disponibilidade ou condição.
2. O que não está na ficha: "vou confirmar com o corretor" + `transferir_corretor`.
3. Não negocia preço e não promete aprovação de financiamento.
4. Se apresenta como assistente virtual do corretor na primeira mensagem.
5. Pede consentimento antes de `registrar_lead` com nome e contato.
6. Só agenda em horários retornados por `listar_horarios`.
7. Mensagens curtas, português informal, no máximo uma pergunta por vez.
8. Dados do comprador só aparecem para o corretor dono do imóvel; toda consulta do painel filtra pelo corretor da sessão.
9. Nenhum dado pessoal em logs ou analytics.

## 4. Fora do escopo da POC

WhatsApp (envio e continuidade da conversa), Google Agenda, páginas de bairro, blog, domínio próprio do corretor, relatório mensal automático, cobrança e multiempresa.

## 5. Roadmap (do README) × cards

| Semana | Entrega | Cards |
| --- | --- | --- |
| 1 | Cadastro de imóvel, fotos, descrição por IA, página pública, SEO, deploy | A1, A2, B1 a B4, E1, E3 |
| 2 | Bolha de chat, atendente com ferramentas, e-mail ao corretor, demo com imóvel real | C1 a C6 |
| 3 | Piloto com 3 corretores e revisão semanal das conversas | D1 a D3, E2 |
| 4 | Ajustes e decisão de seguir ou parar | — |
