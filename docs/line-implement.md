# Linha de implementação — status e observações dos cards

Acompanhamento de execução dos cards de [cards.md](cards.md). Este arquivo registra **o status atual** e **as observações** de cada card; o escopo e as regras de cada um continuam em `cards.md`.

**Estado em 2026-11-19.** Só a base do projeto existe: nenhuma página, rota de API, tela ou teste foi construído ainda. A única página em `src/app` é a inicial.

**Backend:** tudo o que falta para ligar ao Prisma, SMTP, Appwrite e deploy está em [card-back.md](card-back.md). Aqui ficam o status e as observações da interface; as frases "Para ligar ao backend" e "Falta: ligar ao Prisma" abaixo são cobertas por BK-03 a BK-05.

**Legenda:** `PRONTO` · `PARCIAL` · `A FAZER` · `EM ANDAMENTO` · `BLOQUEADO`
**Tamanho:** P (até meio dia) · M (1 dia) · G (2+ dias)

**Como manter:** ao começar um card, mude para `EM ANDAMENTO`; ao terminar, para `PRONTO` e registre a data e o que ficou de fora. Antes de marcar `PRONTO`, rode `pnpm typecheck`, `pnpm lint` e `pnpm build`.

---

## Resumo

| Fase | Cards | PRONTO | PARCIAL | A FAZER |
| --- | --- | --- | --- | --- |
| Base (P) | P-01 a P-11 | 8 | 3 | 0 |
| A — Acesso do corretor | A1, A2 | 0 | 2 | 0 |
| B — Imóvel e página pública | B1 a B4 | 0 | 4 | 0 |
| C — Atendente IA e bolha (foco) | C1 a C6 | 0 | 5 | 1 |
| D — Acompanhamento | D1 a D3 | 0 | 3 | 0 |
| E — SEO, LGPD e qualidade | E1 a E3 | 0 | 2 | 1 |

---

## Base já construída

| Card | Status | Observações |
| --- | --- | --- |
| P-01 Base do projeto | PRONTO | Next.js App Router, TypeScript strict, Tailwind, shadcn (`button`, `sonner`), pnpm. Build, typecheck e lint passam. |
| P-02 Modelo de dados | PRONTO | `User` (corretor), `Imovel`, `Foto`, `Conversa`, `Visita`, `Evento` e tabelas do Auth.js, com migration inicial (`20261118111031_init`). Mudança futura no schema exige nova migration; não apagar a existente. |
| P-03 Seed | PRONTO | Corretor e imóvel de exemplo. É o que permite desenvolver a página e o atendente antes do cadastro completo. |
| P-04 Cliente do banco | PRONTO | Prisma com adapter `pg`, em `src/lib/db.ts`. Só no servidor. |
| P-05 Storage de fotos | PARCIAL | `uploadFoto`, `removerFoto` e `urlFoto` prontos. **Falta** a rota `src/app/api/upload/route.ts` (card B2). O banco guarda o `fileId`, nunca a URL. |
| P-06 Envio de e-mail | PARCIAL | `enviarEmail()` com Nodemailer + `render()`. **Falta** qualquer template (cards A1 e C5). |
| P-07 Formatação pt-BR | PRONTO | Helpers de preço, data e área em `src/lib/format.ts`. |
| P-08 SEO | PARCIAL | Só `urlDoSite()` e `urlDoImovel()`. **Faltam** metadata e JSON-LD (card E1). |
| P-09 Ambiente | PRONTO | `.env.example` completo e `docker-compose.yml` para o Postgres. |
| P-10 Dependências | PRONTO | Atualizadas em 2026-11-19. TypeScript 5.9 e Prisma 7.10.1 mantidos de propósito. |
| P-11 Documentação | PRONTO | README, entidades (RN/RF/RNF), páginas e design system em `docs/`. |

**Pendências de manutenção**
- `@react-email/components` está depreciado e sem uso: remover ou trocar por pacotes individuais ao criar os templates (C5).
- `pnpm test` passa sem arquivos, porque não há testes. O C6 resolve isso.

---

## Fase A — Acesso do corretor

| Card | Tam. | Status | Observações |
| --- | --- | --- | --- |
| A1 Login por link mágico | M | PARCIAL | Implementado em 2026-11-19: Auth.js com provider de e-mail próprio (envio por `src/lib/email.ts`), sessão JWT, `proxy.ts` protegendo `/painel/*`, páginas `/login` e `/login/verificar` (reenvio após 60 s), template `src/emails/link-de-acesso.tsx`, `exigirCorretor()` em `src/lib/session.ts` e `/painel` mínimo com "Sair". Só e-mails de corretores já cadastrados entram, e a resposta é a mesma para e-mail desconhecido. `typecheck`, `lint` e `build` passam; `/painel` sem sessão redireciona para `/login`. **Falta** o teste ponta a ponta (pedir link, receber, entrar): `DATABASE_URL` e `SMTP_*` estão vazios no `.env` local. |
| A2 Perfil do corretor | P | PARCIAL | **Tela pronta com dados de exemplo** (2026-11-20): `/painel/perfil` com nome, CRECI, WhatsApp, foto (envio pela rota `/api/upload` com `alvo=perfil`, apagando a anterior) e horários de visita por dia da semana (`SeletorHorarios`) com a duração da visita. Validação com Zod no formulário e na Server Action. **Os horários e a duração do perfil são os que o atendente oferece** (RN-17), e nome, CRECI, WhatsApp e foto aparecem na página pública do imóvel (sem e-mail nem id). Publicar um imóvel exige nome e CRECI no perfil; a visão geral avisa quando faltam. 10 testes novos. **Falta:** ligar ao Prisma (campos do `User` já existem); testar o envio de foto no Appwrite real. |

## Fase B — Imóvel e página pública

| Card | Tam. | Status | Observações |
| --- | --- | --- | --- |
| B1 Cadastro de imóvel | G | PARCIAL | **Interface e regras prontas com mocks** (2026-11-20). Painel em `/painel/imoveis` (lista com filtro por status, menu de ações, excluir com confirmação), `/painel/imoveis/novo`, `/painel/imoveis/[id]` (formulário `react-hook-form` + Zod com o mesmo schema na Server Action, publicar/despublicar/vendido, copiar link) e `/painel/imoveis/[id]/previa`. Regras testadas: RN-02 (3 fotos), RN-03 (slug e sufixo, fixo após publicar), RN-07 (dono), RN-25. Dados em `src/mocks/painel.ts` por trás de `src/lib/painel/imoveis.ts`. **Para ligar ao backend:** reescrever `src/lib/painel/imoveis.ts` e `src/lib/imoveis.ts` com Prisma (as assinaturas ficam). **Desvios do pages.md:** formulário em uma página só (não em etapas) e as fotos entram na edição, depois do primeiro salvar; sem latitude/longitude no formulário (o mapa só aparece com coordenadas), a definir com geocodificação. |
| B2 Upload e gestão de fotos | M | PARCIAL | `POST /api/upload` pronta e testada (7 testes): exige sessão, confere o dono do imóvel, aceita só JPG/PNG/WebP até 10 MB e confere a assinatura do arquivo. Painel com envio múltiplo, arrastar e soltar, legenda (vira o `alt`), mover e remover; a primeira é a capa. Com `USAR_MOCKS=1` grava em `public/mock-uploads` (ignorado pelo git); sem ela usa o Appwrite via `src/lib/storage.ts`, **ainda não testado com credenciais reais**. Falta incluir o host do Appwrite em `images.remotePatterns` e testar o envio real. |
| B3 Página pública do imóvel | G | PARCIAL | Interface completa (2026-11-19), agora em `PaginaImovel` e reaproveitada na pré-visualização do corretor. Lê o mesmo store do painel: o que o corretor cadastra e publica aparece em `/imovel/[slug]`, com `revalidatePath` nas Server Actions. Só envia ao cliente uma lista explícita de campos (sem `corretorId`). **Para ligar ao backend** troque as consultas em `src/lib/imoveis.ts`. **Pendências:** "Conversar"/"Agendar visita" disparam `showing:abrir-chat` e só funcionam com a bolha (C4); faltam o evento `visualizacao` (D3), JSON-LD e sitemap (E1) e `/privacidade` (E2); slug inexistente responde 200 com `noindex` (limitação do streaming com Cache Components); `InfoBairro` sem campo no schema; nome, CRECI e WhatsApp do corretor ainda vêm de um mock. Visual não conferido em navegador. |
| B4 Descrição gerada por IA | M | PARCIAL | Botão "Gerar título e descrição" no formulário preenche os campos editáveis; nada é publicado sozinho (RN-06). **A geração é um modelo de texto fixo** (`src/lib/ai/descricao.ts`), que usa só os dados da ficha, com 2 testes. Quando o provedor de IA for escolhido, a função passa a chamar o modelo com a mesma entrada e saída. |

## Fase C — Atendente IA e bolha de chat (foco da POC)

| Card | Tam. | Status | Observações |
| --- | --- | --- | --- |
| C1 Prompt do atendente | M | PARCIAL | `src/lib/ai/prompt.ts` pronto: `montarPrompt(imovel, agora)` com as 7 regras, o fluxo de agendamento, a seção de segurança (RNF-11), a ficha completa e o bairro. Em 2026-11-20 a regra 4 mudou: a saudação (RN-13) agora é mostrada pela página (`src/lib/ai/saudacao.ts`) e o atendente não se apresenta de novo. A mudança passou pelos 7 casos contra o modelo real em 2026-11-20. |
| C2 Ferramentas do atendente | G | PARCIAL | Regras em `src/lib/ai/atendimento.ts`, tools do Strands em `tools.ts`, cálculo de horários em `horarios.ts` (fuso -03:00, 12 h a 14 dias, conflito por duração). Tudo validado com Zod, conferindo imóvel publicado e igual ao da conversa. Roda sobre o repositório em memória `src/mocks/atendimento.ts`, atrás da interface `RepositorioAtendimento`. **Para ligar ao backend:** implementar essa interface com Prisma (card C3); o envio dos e-mails de `agendar_visita` entra no C5; o conflito de horário precisa de proteção no banco contra duas visitas simultâneas. |
| C3 Rota `/api/chat` com streaming | G | PARCIAL | **Implementada com OpenRouter** (2026-11-20), testada com um modelo falso (12 testes). `POST /api/chat` valida o corpo com Zod, devolve NDJSON (`inicio`, `texto`, `fim`, `erro`), cria um agente novo por requisição com o histórico da conversa e guarda o histórico completo (inclui chamadas de ferramenta). Modelo em `src/lib/ai/modelo.ts` (`OpenAIModel` apontando para o OpenRouter; `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` opcional). Limites: 30 mensagens do comprador por conversa (RN-16) e 20 por minuto por IP e por conversa (RNF-10, em memória, vale para uma instância). Só atende imóvel publicado; conversa de outro imóvel dá 404. Logs só com o id da conversa e o tipo do erro. Sem IA configurada devolve 503 e a bolha usa o atendente simulado. Dependência nova: `openai@6.49.0` (exigida pelo `OpenAIModel`; o SDK pede `^6.45`). **Testada com o modelo real** (2026-11-20): respondeu com dados da ficha, listou horários e devolveu os botões. **Falta:** trocar o repositório em memória por Prisma (`src/lib/ai/repositorio-atual.ts`); escolher o modelo e acompanhar o custo; duas mensagens simultâneas na mesma conversa podem sobrescrever o histórico. |
| C4 Bolha de chat | G | PARCIAL | **Bolha pronta com atendente simulado** (2026-11-20), em `src/components/chat-bubble/`. Carregada com `next/dynamic` (`ssr: false`) em tempo ocioso ou no primeiro clique, fora do HTML inicial. Celular em tela cheia, desktop no canto inferior direito. Botão real com `aria-label`, foco vai para o campo ao abrir e volta ao botão ao fechar, foco preso dentro da bolha, fecha com Esc, alvos de 44 px. Id e histórico no `localStorage` dentro de `try/catch`. Sugestões rápidas, indicador de digitação, resposta em streaming simulado, botões de consentimento e link da política de privacidade. "Agendar visita" abre direto no agendamento (contrato: evento `showing:abrir-chat`). A conversa é guiada por `mock-atendente.ts` (regras, sem IA), com 11 testes das regras do atendente. **Para ligar ao backend (C3):** trocar `responder()` por `fetch('/api/chat')` com streaming, mapear tools para `sugestoes`/`pedeConsentimento` e guardar só o id da conversa no `localStorage`. **Falta:** limite de 30 mensagens (RN-16) e eventos de métricas; telas não conferidas em navegador; o aviso de privacidade aponta para `/privacidade`, que ainda não existe. |
| C5 E-mails de visita e transferência | M | MOVIDO | Backend: ver BK-07 em [card-back.md](card-back.md). |
| C6 Casos de teste do atendente | M | PARCIAL | `pnpm test ai`: testes de horários, regras de RN-11 a RN-20, imóvel e argumentos inválidos, prompt, descrição e rota. **Os 7 casos contra o modelo real foram executados em 2026-11-20 com o modelo configurado no `.env` e passaram** (na primeira rodada 6 de 7: o caso do horário inventado estourou os 600 tokens por chamada; o limite subiu para 1500 e o caso passou). Rodam sempre que `AI_API_KEY` e `AI_MODEL` existem, ou seja, `pnpm test` agora também chama a API (cerca de 1 minuto e alguns tokens). Os modelos variam: repetir antes de cada mudança no prompt. |

## Fase D — Acompanhamento do corretor

| Card | Tam. | Status | Observações |
| --- | --- | --- | --- |
| D1 Visitas | M | PARCIAL | **Tela pronta com dados de exemplo** (2026-11-20): `/painel/visitas` com filtros (próximas, realizadas, canceladas, todas), data e hora, imóvel, nome e contato do comprador (telefone e e-mail clicáveis), e as ações Confirmar, Marcar como realizada e Cancelar (com confirmação). Só o corretor muda o status (RN-20) e as transições são pedida → confirmada → realizada, com cancelar antes disso. Visita cancelada libera o horário para o atendente (RN-17). Tudo filtra pelo corretor da sessão (RN-23); 9 testes nas regras. Visão geral do painel mostra as próximas visitas dos 7 dias. **Falta:** ligar ao Prisma (`src/lib/painel/atendimentos.ts` e `src/mocks/atendimento.ts`); o comprador não é avisado ao cancelar (e-mails são o card C5). |
| D2 Conversas e leads | M | PARCIAL | **Telas prontas com dados de exemplo** (2026-11-20): `/painel/conversas` (filtros todas, transferidas, com contato, com visita; transferidas em destaque, com o motivo) e `/painel/conversas/[id]` (perfil do comprador, consentimento com data e hora, visita e o histórico completo, sem chamadas de ferramenta). Nome e contato só aparecem com consentimento (RN-11) e só para o corretor dono do imóvel (RN-23), testado. Com `USAR_MOCKS=1` há 6 conversas de exemplo (nomes fictícios). **Falta:** ligar ao Prisma; marcar conversa transferida como lida (a visão geral hoje lista todas as transferidas). |
| D3 Métricas por imóvel | M | PARCIAL | **Interface e eventos prontos com dados de exemplo** (2026-11-20). Eventos sem dado pessoal (`visualizacao` e `chat_aberto` do navegador por `POST /api/eventos`, uma vez por sessão; `chat_mensagem`, `contato_capturado`, `visita_pedida` e `transferencia` do servidor em `/api/chat`). `CartaoMetrica` na visão geral (últimos 30 dias) e na aba Desempenho; colunas por imóvel na lista. A pré-visualização do corretor não conta. 5 testes. **Falta:** ligar à tabela `Evento` do Prisma. |

## Fase E — SEO, privacidade e qualidade

| Card | Tam. | Status | Observações |
| --- | --- | --- | --- |
| E1 SEO da página | M | PARCIAL | **Feito** (2026-11-20): JSON-LD `RealEstateListing` com `Offer` e `Place` (endereço e coordenadas só com `mostrarEndereco`, RN-05; escape seguro), `sitemap.ts` (só publicados), `robots.ts` (bloqueia painel, login e API) e `llms.txt`; vendido segue com `noindex`. 5 testes. **Falta:** medir Lighthouse; slug inexistente ainda responde 200 com `noindex` (streaming com Cache Components). |
| E2 Privacidade e LGPD | M | PARCIAL | `/privacidade` criada em linguagem simples (dados coletados, finalidade, quem vê, direitos, exclusão), linkada do rodapé, da home e da bolha; contato por `NEXT_PUBLIC_EMAIL_PRIVACIDADE` (sem ele, manda falar com o corretor). **Falta:** definir o prazo de guarda, revisão por uma pessoa de confiança antes do piloto (RNF-14) e a exclusão a pedido no backend (RN-24). |
| E3 Qualidade e deploy | M | MOVIDO | Backend: ver BK-10 em [card-back.md](card-back.md). |

---

## Ordem de ataque sugerida

1. **A1** — login mínimo, para o painel existir.
2. **B3** — página pública com os dados do seed.
3. **C1 + C2 + C6** — prompt, tools e testes juntos.
4. **C3 + C4** — rota de chat e bolha.
5. **C5** — e-mails de visita.
6. Depois: B1/B2/B4, A2, Fase D, E1 a E3.

## Registro de mudanças

| Data | Mudança |
| --- | --- |
| 2026-11-20 | Cards do backend movidos para `card-back.md` (BK-01 a BK-10); C5 e E3 passam para lá. |
| 2026-11-20 | Telas `/login` e `/login/verificar` refeitas a partir do design "Tela de login do Showing" (Claude Design): layout dividido com painel de história (3 mensagens, avanço automático a cada 2 s, pausa com mouse/foco/aba escondida, sem avanço com movimento reduzido), formulário de um campo com validação no cliente (mesmo schema Zod do servidor), estados erro/enviando/verificar, reenvio após 60 s, no máximo 5 pedidos por e-mail e por IP por hora, e redirecionamento de quem já está logado. Fontes Space Grotesk e Inter só nesse layout. |
| 2026-11-20 | **Página inicial (`/`) refeita a partir do design "Página inicial para corretores"**: hero com título que se escreve, frase que troca com a conversa de exemplo e celular com o assistente; seções "O problema" e "Benefícios" que grudam na tela, "A virada", demo interativa "Seja o comprador por um minuto" (tudo no navegador, com dados fictícios), "Como funciona", comparação "Sem / Com Showing" em abas, FAQ e chamada final. Movimento ligado à rolagem com um único ouvinte (`use-secao.ts`); com "reduzir movimento" tudo vira lista estática. O formulário "Quero participar" guarda só o e-mail (`InteressePiloto`, 5 pedidos por IP por hora, sem dado pessoal em log) e a `/privacidade` foi atualizada. Texto todo no HTML (SEO). Sem violações do axe no desktop, no celular e com movimento reduzido. Componentes da home antiga e o CSS da história rolável foram removidos. |
| 2026-11-19 | Arquivo criado a partir de `cards.md`. Nenhum card novo concluído desde a base. |
| 2026-11-19 | A1 implementado (PARCIAL): falta testar o fluxo completo com banco e SMTP configurados. |
| 2026-11-20 | A2 implementado com mocks (PARCIAL): `/painel/perfil`, horários do perfil alimentam o atendente, perfil real na página pública, publicar exige perfil completo. Bolha de chat: ao chegar a 30 mensagens do comprador (ou aviso do servidor) o campo some, aparece o aviso com o link do WhatsApp do corretor (se houver) e o foco vai para ele; lógica em `limite.ts`, 4 testes. `typecheck`, `lint`, `build` e 96 testes passam. Não conferido em navegador. |
| 2026-11-20 | **Novo visual a partir dos modelos de `layouts/`**: paleta creme, verde-floresta e bronze, fontes Manrope e Cormorant (só a marca), raio 16 px. Página do imóvel refeita no formato do modelo 2 (hero com foto, cartões sobrepostos, sobre o imóvel, ficha técnica, destaques numerados, FAQ montado com os dados do anúncio, local, galeria em grade, faixa de chamada, rodapé); página inicial refeita (hero, cartões, apresentação, história "Como funciona", faixa escura do atendente, FAQ de corretores, chamada final); login e cabeçalho do painel restilizados. Blocos em `src/components/site/`. Docs `identidade-visual.md` e `pages.md` atualizados. `typecheck`, `lint`, `build` e 82 testes passam. **Não conferido em navegador.** |
| 2026-11-20 | Chaves de IA configuradas: 7 casos ao vivo passaram, rota `/api/chat` verificada de ponta a ponta com o modelo real. `maxTokens` subiu de 600 para 1500 (modelo que raciocina estourava). |
| 2026-11-20 | Tela de clientes: `/painel/clientes` (lista com busca e filtro por visita) e `/painel/clientes/[id]` (contato, perfil, consentimento, visitas e conversas). Conversas com o mesmo telefone ou e-mail viram um cliente; só entram compradores que autorizaram guardar os dados; o id da URL é opaco. 12 testes nessa camada; `typecheck`, `lint` e `build` passam. Não conferida em navegador. |
| 2026-11-20 | D1 e D2 implementados com mocks (PARCIAL): `/painel/visitas`, `/painel/conversas` e detalhe, links no menu e blocos na visão geral. 79 testes passam; `typecheck`, `lint` e `build` passam. Telas não conferidas em navegador. |
| 2026-11-20 | C3 implementado com OpenRouter (PARCIAL): rota `/api/chat` com streaming, limites, bolha ligada à API com o simulado como reserva, 7 casos ao vivo escritos e não executados. 70 testes passam; `typecheck`, `lint` e `build` passam. Adicionada a dependência `openai@6.49.0`. |
| 2026-11-20 | **Frontend: revisão e fechamento.** (1) Correções de layout no celular (menu e abas do painel, hero, cartões, maquete). (2) `/privacidade`, `loading.tsx` com esqueletos, `error.tsx`, `not-found` e `global-error`. (3) Bolha completa: foto do corretor, convite após 8 s, cartão "Visita pedida", "Tentar de novo", retomada pelo servidor por `GET /api/chat` sem guardar texto no aparelho, consentimento "Pode guardar / Prefiro não". (4) Painel no visual novo: visão geral com métricas e ações rápidas, imóveis em tabela, visitas por dia, conversas com "marcar como lida" e contador no menu, clientes, cadastro em etapas (dados criam o rascunho, editor em abas com Revisão e Desempenho), pré-visualização fora do layout do painel. (5) SEO (JSON-LD, sitemap, robots, llms.txt) e hero em foto no lugar do vídeo. (6) Limpeza: `@react-email/components` removido, cores de status viram tokens. 112 testes passam; `typecheck`, `lint` e `build` passam. Telas conferidas por capturas só até a Fase 1. |
| 2026-11-20 | Seção sobre o atendente de IA na página inicial (`AtendenteIA`, antes `ExemplosCasas`): destaque + 3 cartões, cada um uma regra do atendente (só a ficha, passa o que não sabe, não negocia preço, só agenda em horários livres e com consentimento). Mesmo layout e hover do exemplo, fotos de casas do Unsplash. Os cartões não levam a lugar nenhum. |
| 2026-11-20 | Hero da página inicial com vídeo de fundo, barra em vidro líquido, título letra por letra e fades (`src/components/home/Hero.tsx`); a história "Como funciona" passa a ter 3 cenas logo depois dele. Vídeo de exemplo em CDN externo, a trocar. `typecheck`, `lint`, `build` e testes passam; não conferido em navegador. |
| 2026-11-20 | Fotos de exemplo agora são do Unsplash (6 fotos, Unsplash License) em vez das ilustrações SVG, que foram removidas. IDs e créditos em `src/mocks/unsplash.ts` e `docs/creditos-imagens.md`; `images.unsplash.com` entrou em `images.remotePatterns`. Só para desenvolvimento; trocar por fotos reais antes de qualquer demonstração. |
| 2026-11-20 | (substituído pela linha acima) Imagens de placeholder: 6 ilustrações SVG em `public/mocks/` (fachada, sala, cozinha, quarto, sacada, banheiro), na paleta da marca e marcadas "Foto de exemplo". A fachada é a capa dos imóveis de exemplo e aparece na maquete da página inicial. Só para desenvolvimento; em produção as fotos vêm do Appwrite. |
| 2026-11-20 | Página inicial refeita com identidade visual: logotipo (balão-casa), favicon, `docs/identidade-visual.md` e história rolável em 4 cenas (CSS + `HistoriaScroll`, sem biblioteca; vira seções normais com `prefers-reduced-motion` ou sem JS). `typecheck`, `lint` e `build` passam. Não conferida em navegador. `.agents/` e `.claude/` entraram no ignore do lint. |
| 2026-11-20 | C4 implementado com atendente simulado (PARCIAL): 58 testes passam; `typecheck`, `lint` e `build` passam. Telas não conferidas em navegador. |
| 2026-11-20 | Página inicial `/` implementada (pages.md 3.4): frase do produto, 3 passos e "Entrar como corretor". Estática; `typecheck`, `lint` e `build` passam. Aponta para `/privacidade`, que ainda não existe (E2). |
| 2026-11-20 | Fase B implementada com mocks (B1, B2, B4 PARCIAL; B3 atualizada): 47 testes passam; `typecheck`, `lint` e `build` passam. Painel sem login com `USAR_MOCKS=1` (só em desenvolvimento). Telas não conferidas em navegador. |
| 2026-11-19 | C1, C2 e C6 implementados com mocks (PARCIAL): 26 testes passam; falta o modelo real. |
| 2026-11-19 | B3 implementado com mocks (PARCIAL): `typecheck`, `lint` e `build` passam. Corrigidos o import `cn` dos componentes shadcn e `urlDoSite()` com variável vazia. |
