# Páginas, front-end e design system — POC

Regras de front-end, design system e descrição de cada página da POC (nome provisório: Showing). Complementa `README.md`, `CLAUDE.md` e `entitys.md` (os códigos RN, RF e RNF citados aqui estão lá).

---

## 1. Regras de front-end

### 1.1 Gerais

- **Next.js App Router.** Server Components por padrão; `"use client"` só em componentes com interação (bolha de chat, formulários, upload, carrossel).
- **Dados no servidor.** Páginas buscam dados direto no servidor (Prisma). O cliente nunca chama o banco nem o Appwrite com chave.
- **Mutações do painel** por Server Actions, com validação Zod e `revalidatePath` da página afetada.
- **Formulários** com `react-hook-form` + `zod` + componente `Form` do shadcn. O mesmo schema Zod valida no cliente e na Server Action.
- **Componentes de interface** vêm do shadcn/ui (`src/components/ui`). Antes de criar um componente, verifique se existe no shadcn. Não edite `ui/` à mão; crie componentes de domínio que os usem.
- **Ícones:** `lucide-react` (o mesmo do shadcn). Nunca emoji na interface.
- **Datas e moeda:** sempre com `Intl` em `pt-BR` e fuso `America/Sao_Paulo`. Use os helpers de `src/lib/format.ts` (`formatarPreco`, `formatarData`, `formatarDataHora`, `formatarArea`).
- **Textos** em português do Brasil, tom direto e cordial, frases curtas. Nada de "Lorem ipsum" ou dados inventados.

### 1.2 Organização de pastas

```
src/
├── app/
│   ├── (public)/                 páginas públicas (sem login)
│   ├── (auth)/                   login e verificação
│   └── (painel)/painel/          área do corretor (exige login)
├── components/
│   ├── ui/                       shadcn (não editar à mão)
│   ├── imovel/                   galeria, ficha, mapa, cartão do corretor
│   ├── chat-bubble/              bolha de chat
│   ├── painel/                   formulários, tabelas, métricas do painel
│   └── layout/                   cabeçalho, rodapé, navegação
└── lib/
    ├── format.ts                 formatação pt-BR
    └── ...
```

Componentes de domínio em PascalCase (`GaleriaImovel.tsx`), um componente por arquivo.

### 1.3 Estados obrigatórios

Toda tela com dados tem os quatro estados desenhados e implementados:

| Estado | Como mostrar |
| --- | --- |
| Carregando | `Skeleton` do shadcn com o formato do conteúdo (via `loading.tsx` ou `Suspense`) |
| Vazio | Texto explicando o que aparece ali + ação principal (ex.: "Cadastrar primeiro imóvel") |
| Erro | Mensagem em português do que aconteceu + botão "Tentar de novo" (`error.tsx`) |
| Sucesso | Toast (`sonner`) curto após ações: "Imóvel publicado", "Fotos salvas" |

### 1.4 Responsividade

- **Mobile-first.** Projete para 390 px de largura e depois amplie. Corretor e comprador usam principalmente o celular.
- Breakpoints do Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Largura máxima do conteúdo: `max-w-6xl` (1152 px) nas páginas públicas, `max-w-7xl` no painel.
- Tabelas do painel viram lista de cartões abaixo de `md`.

### 1.5 Acessibilidade (RNF-16)

- Contraste mínimo WCAG AA (4,5:1 em texto normal).
- Alvos de toque com no mínimo 44 × 44 px.
- Todo controle é um elemento real (`button`, `a`, `input` com `label`); nada de `div` clicável.
- Botões só com ícone têm `aria-label`.
- Foco visível em todos os elementos interativos (`ring` do tema).
- Imagens com `alt` descritivo; a legenda da foto vira o `alt`.
- Diálogos e a bolha prendem o foco enquanto abertos e fecham com Esc.

---

## 2. Design system

A marca (logotipo, tom de voz, movimento) está em [identidade-visual.md](identidade-visual.md).

### 2.1 Princípios

1. **O imóvel é o protagonista.** Fotos grandes, informação clara, interface discreta.
2. **Confiança antes de beleza.** CRECI, foto do corretor e dados reais visíveis; nada que pareça anúncio genérico.
3. **Uma ação principal por tela.** Na página pública, conversar ou agendar visita; no painel, a próxima tarefa do corretor.
4. **Rápido no celular.** Cada componente justifica o peso que adiciona.

### 2.2 Cores

Atualizado em 2026-11-20 a partir dos modelos da pasta `layouts/`. Tokens em `src/app/globals.css`; justificativa e uso em [identidade-visual.md](identidade-visual.md). Só modo claro na POC.

| Token | Uso | Cor |
| --- | --- | --- |
| `--background` | Fundo das páginas (creme) | `#F4F1EA` |
| `--foreground` | Texto principal | `#1B2A22` |
| `--card` / `--popover` | Cartões e menus | `#FBFAF6` |
| `--primary` | Verde-floresta: botões escuros, marca, cabeçalho da bolha | `#1F3A2B` |
| `--cta` | Bronze: a ação principal da tela (Agendar visita, Entrar) | `#7A5A3A` |
| `--muted` / `--secondary` | Faixas e cartões secundários | `#ECE7DB` |
| `--muted-foreground` | Texto secundário | `#5C675F` |
| `--accent` | Fundo de hover | `#E6DFCE` |
| `--border` / `--input` | Bordas e campos | `#DDD6C6` |
| `--destructive` | Excluir, erros | `#B42318` |
| `--brand-deep` | Faixas escuras (hero, chamada final, atendente) | `#1B2F24` |
| `--brand-moss` / `--brand-glow` | Tons do fundo escuro | `#2D4A38` / `#5C7F66` |
| `--brand-sand` | Rodapé | `#D9D5C6` |

Cores de status (badges), sem mudança:

| Status | Fundo | Texto |
| --- | --- | --- |
| Publicado / Confirmada | `#E3F4EC` | `#0B5A3B` |
| Rascunho / Pedida | `#FFF4E0` | `#7A4A00` |
| Vendido / Realizada | `#E8EEF6` | `#1F3A5F` |
| Cancelada | `#FDECEA` | `#8A1C12` |

Regra: o bronze (`--cta`) marca a ação mais importante da tela; no máximo uma ou duas vezes por seção.

### 2.3 Tipografia

Fontes via `next/font/google`:

- **Títulos e texto:** Manrope (300 a 700)
- **Nome da marca:** Cormorant Garamond (500 a 700), só no logotipo

| Estilo | Mobile | Desktop | Uso |
| --- | --- | --- | --- |
| Hero | 36 px / 500 | 60 px / 500 | Título do imóvel e da página inicial |
| H2 de seção | 30 px / 500 | 36 px / 500 | Seções das páginas públicas |
| H1 do painel | 26 px / 700 | 32 px / 700 | Título de página do painel |
| Corpo | 16 px / 400 | 16 px / 400 | Texto, altura de linha 1,6 |
| Pequeno | 14 px / 400 | 14 px / 400 | Legendas, metadados |
| Preço | 28 px / 700 | 32 px / 700 | Preço na página do imóvel |

Corpo nunca abaixo de 16 px no celular (evita zoom automático em campos no iOS).

### 2.4 Espaçamento, raio e sombra

- **Espaçamento:** escala do Tailwind em múltiplos de 4 px. Entre seções da página pública: `py-12` (mobile) / `py-16` (desktop). Dentro de cartões: `p-4` / `p-6`.
- **Raio:** `--radius: 0.75rem` (12 px) para cartões; botões e campos herdam do shadcn (`rounded-md`); fotos `rounded-xl`; bolha de chat `rounded-2xl`.
- **Sombra:** só em elementos flutuantes (bolha, botão flutuante, menus): `shadow-lg`. Cartões usam borda, não sombra.

### 2.5 Componentes de domínio

| Componente | Base shadcn | Descrição |
| --- | --- | --- |
| `GaleriaImovel` | `carousel`, `dialog` | Foto de capa grande + miniaturas; toque abre em tela cheia com navegação |
| `FichaImovel` | `card`, `badge` | Preço, condomínio, IPTU, quartos, suítes, banheiros, vagas, área, badges de financiamento/FGTS |
| `CaracteristicasImovel` | `badge` | Lista das características em chips |
| `MapaRegiao` | — | Mapa da região aproximada (RN-05); carregado só quando aparece na tela |
| `InfoBairro` | `card` | Escolas, mercados, saúde, distância do centro |
| `CartaoCorretor` | `card`, `avatar`, `button` | Foto, nome, CRECI, botão "Conversar" que abre a bolha |
| `BarraAcaoMobile` | `button` | Barra fixa no rodapé do celular: preço + "Agendar visita" |
| `ChatBubble` | `sheet`, `scroll-area`, `avatar`, `input`, `button` | Bolha de chat (seção 4) |
| `BadgeStatus` | `badge` | Status de imóvel e visita com as cores da tabela 2.2 |
| `CartaoMetrica` | `card` | Número grande + rótulo (visualizações, conversas, visitas) |
| `UploadFotos` | `button`, `card` | Arrastar e soltar, prévia, reordenar, legenda, progresso |
| `SeletorHorarios` | `toggle-group`, `button` | Grade de dias da semana × horários do corretor |

Instale também: `pnpm dlx shadcn@latest add skeleton toggle-group dropdown-menu tabs separator tooltip switch`.

### 2.6 Botões

| Variante | Uso |
| --- | --- |
| `default` (primary) | Ação principal da tela: "Publicar", "Enviar" |
| `accent` (variante própria) | "Agendar visita" na página pública; no máximo um por tela |
| `outline` | Ações secundárias: "Pré-visualizar", "Cancelar" |
| `ghost` | Ações em tabelas e menus |
| `destructive` | Excluir; sempre com `alert-dialog` de confirmação |

Texto do botão diz o que acontece ("Publicar imóvel"), nunca "OK" ou "Enviar" genérico quando houver contexto.

---

## 3. Páginas

### 3.1 Mapa de rotas

| Rota | Acesso | Página |
| --- | --- | --- |
| `/imovel/[slug]` | Pública | Página do imóvel |
| `/privacidade` | Pública | Política de privacidade |
| `/` | Pública | Página inicial simples da POC |
| `/login` | Pública | Login do corretor |
| `/login/verificar` | Pública | Aviso "veja seu e-mail" |
| `/painel` | Corretor | Visão geral |
| `/painel/imoveis` | Corretor | Lista de imóveis |
| `/painel/imoveis/novo` | Corretor | Cadastro de imóvel |
| `/painel/imoveis/[id]` | Corretor | Edição do imóvel (abas) |
| `/painel/imoveis/[id]/previa` | Corretor | Pré-visualização da página |
| `/painel/visitas` | Corretor | Visitas |
| `/painel/conversas` | Corretor | Conversas |
| `/painel/conversas/[id]` | Corretor | Detalhe da conversa |
| `/painel/perfil` | Corretor | Perfil e horários |

Rotas `/painel/*` protegidas por middleware do Auth.js: sem sessão, redireciona para `/login`.

### 3.2 Página do imóvel — `/imovel/[slug]`

**Objetivo:** fazer o comprador entender o imóvel e iniciar uma conversa ou pedir visita. É a página mais importante da POC. (RF-13, RF-14, RF-26)

**Renderização:** SSG com revalidação ao salvar no painel. `generateMetadata` monta title, description, Open Graph (foto de capa) e JSON-LD. Só imóveis `publicado` ou `vendido` (RN-01, RN-04); outros retornam 404.

**Estrutura (de cima para baixo):**

1. **Cabeçalho mínimo:** nome do corretor e CRECI à esquerda; botão "Conversar" à direita (abre a bolha).
2. **Galeria:** foto de capa grande (proporção 4:3 no mobile, 16:9 no desktop) com contador "1/12"; miniaturas no desktop; toque abre em tela cheia.
3. **Título e preço:** título do imóvel (Display), bairro e cidade, preço em destaque, condomínio e IPTU logo abaixo.
4. **Destaques em ícones:** quartos (suítes), banheiros, vagas, área.
5. **Badges:** "Aceita financiamento", "Aceita FGTS", finalidade.
6. **Chamada principal:** botão `accent` "Agendar visita" (abre a bolha direto no agendamento) + botão `outline` "Tirar dúvidas".
7. **Descrição:** texto do imóvel, com "Ler mais" se passar de 6 linhas no mobile.
8. **Características:** chips.
9. **Localização:** mapa da região e endereço conforme RN-05.
10. **Sobre o bairro:** `InfoBairro`.
11. **Corretor:** `CartaoCorretor`.
12. **Rodapé:** link para `/privacidade`, "Página criada com Showing".

**Desktop (≥ lg):** duas colunas; à direita, um cartão fixo (sticky) com preço, chamada principal e cartão do corretor.

**Mobile:** `BarraAcaoMobile` fixa no rodapé com preço e "Agendar visita"; a bolha flutuante fica acima dela.

**Estado vendido (RN-04):** faixa no topo "Este imóvel foi vendido", sem bolha e sem chamada de visita; o cartão do corretor muda para "Fale com [nome] sobre outros imóveis" com link do WhatsApp, se houver.

**Eventos:** `visualizacao` ao carregar (uma vez por sessão).

### 3.3 Política de privacidade — `/privacidade`

Página de texto simples: quais dados são coletados na conversa, para quê, quem vê (só o corretor do imóvel), por quanto tempo, como pedir exclusão (RN-24). Linguagem clara, sem juridiquês desnecessário. Revisar com alguém de confiança antes do piloto (RNF-14).

### 3.4 Página inicial — `/`

Na POC, página curta: o que é o produto em uma frase, os 3 passos (fotos → página → visita marcada) e o botão "Entrar como corretor". Não é landing page de vendas; serve para quem cair no domínio.

### 3.5 Login — `/login` e `/login/verificar`

- `/login`: campo de e-mail + botão "Receber link de acesso". Erro em português se o e-mail for inválido.
- `/login/verificar`: "Enviamos um link para [e-mail]. Abra no mesmo aparelho." + "Reenviar" após 60 s.
- Na POC, só e-mails cadastrados (os 3 corretores do piloto) conseguem entrar.

### 3.6 Visão geral — `/painel`

**Objetivo:** mostrar ao corretor o que precisa de atenção agora. (RF-12)

- **Próximas visitas:** lista das visitas `pedida` e `confirmada` dos próximos 7 dias, com ação rápida "Confirmar".
- **Conversas transferidas:** conversas em que o atendente passou para o corretor e ainda não foram lidas.
- **Métricas dos últimos 30 dias:** 4 `CartaoMetrica` — visualizações, conversas, contatos capturados, visitas pedidas.
- **Vazio:** sem imóveis → "Cadastre seu primeiro imóvel para ter sua página e seu atendente" + botão.

### 3.7 Lista de imóveis — `/painel/imoveis`

- Tabela (desktop) / cartões (mobile): foto de capa, título, bairro, preço, `BadgeStatus`, visualizações, conversas, visitas.
- Ações por imóvel (`dropdown-menu`): Editar, Copiar link, Ver página, Marcar como vendido, Excluir.
- Filtro por status (`tabs`: Todos, Publicados, Rascunhos, Vendidos).
- Botão principal "Novo imóvel".

### 3.8 Cadastro de imóvel — `/painel/imoveis/novo`

**Fluxo em etapas** (indicador de progresso no topo):

1. **Dados:** tipo, finalidade, bairro, cidade, endereço (+ switch "Mostrar endereço completo na página"), preço, condomínio, IPTU, quartos, suítes, banheiros, vagas, área, financiamento, FGTS.
2. **Características:** chips selecionáveis com as mais comuns + campo para adicionar outras; campo "Informações adicionais para o atendente" com texto de ajuda: "O atendente usa este texto para responder dúvidas. Ex.: aceita pet, data de entrega das chaves."
3. **Fotos:** `UploadFotos`; mínimo 3 (RN-02); primeira é a capa.
4. **Texto:** botão "Gerar título e descrição com IA" (RF-05); resultado em campos editáveis; aviso "Revise antes de publicar" (RN-06).
5. **Revisão:** resumo + botões "Pré-visualizar" e "Publicar".

O imóvel é salvo como `rascunho` desde a etapa 1; o corretor pode sair e voltar.

### 3.9 Edição de imóvel — `/painel/imoveis/[id]`

Mesmo conteúdo do cadastro, organizado em `tabs`: Dados, Características, Fotos, Texto, Desempenho.

- **Desempenho:** métricas do imóvel e lista das conversas e visitas dele.
- Cabeçalho com título, `BadgeStatus`, botões "Copiar link", "Ver página" e o seletor de status (Publicar / Despublicar / Marcar como vendido).
- Salvar mostra toast e revalida a página pública.

### 3.10 Pré-visualização — `/painel/imoveis/[id]/previa`

A página do imóvel exatamente como o comprador verá, com uma faixa no topo "Pré-visualização — esta página ainda não está publicada" e botão "Publicar". A bolha funciona em modo de teste (conversa marcada como teste e excluída das métricas).

### 3.11 Visitas — `/painel/visitas`

- Lista agrupada por dia: horário, imóvel, nome e contato do comprador, forma de pagamento, `BadgeStatus`.
- Ações: Confirmar, Marcar como realizada, Cancelar, Ver conversa (RN-20).
- Filtro: Próximas / Passadas / Canceladas.
- Botões de contato rápido: ligar e abrir WhatsApp com o número do comprador.

### 3.12 Conversas — `/painel/conversas` e `/painel/conversas/[id]`

- **Lista:** imóvel, nome do lead (ou "Visitante"), última mensagem, data, selos "Transferida" e "Visita pedida". Transferidas não lidas aparecem primeiro (RF-10).
- **Detalhe:** histórico no formato de chat (mensagens do comprador à direita, do atendente à esquerda), painel lateral com o perfil do lead, consentimento, visita vinculada e motivo da transferência. Somente leitura na POC: o corretor responde por telefone ou WhatsApp.

### 3.13 Perfil — `/painel/perfil`

- Dados: nome, CRECI, WhatsApp, foto.
- **Horários de visita:** `SeletorHorarios` (dias × horários) e duração da visita. Texto de ajuda: "O atendente só oferece estes horários aos compradores."

---

## 4. Bolha de chat

### 4.1 Estados

| Estado | Aparência |
| --- | --- |
| Fechada | Botão redondo de 56 px no canto inferior direito, foto do corretor, `shadow-lg`; no mobile, acima da `BarraAcaoMobile`. Após 8 s na página, um balão curto "Dúvidas sobre este imóvel?" aparece ao lado (uma vez por sessão) |
| Aberta (desktop) | Painel de 380 × 600 px ancorado no canto inferior direito |
| Aberta (mobile) | Tela cheia (`sheet` de baixo para cima) |
| Respondendo | Indicador de três pontos; texto aparece em streaming |
| Consentimento | Mensagem do atendente com dois botões: "Pode guardar" / "Prefiro não" (RF-18) |
| Escolha de horário | Horários oferecidos como botões (chips), não só texto |
| Visita pedida | Cartão de confirmação: imóvel, data, hora, "O corretor vai confirmar com você" |
| Erro | "Não consegui responder agora. Tente de novo." + botão; a mensagem do comprador não se perde |
| Limite atingido | Mensagem final com contato do corretor (RN-16) |

### 4.2 Estrutura do painel aberto

1. **Cabeçalho** (`primary`): foto, "Assistente de [corretor]", "Responde na hora", botão fechar.
2. **Mensagens** (`scroll-area`): atendente à esquerda em `muted`; comprador à direita em `primary`. Rolagem automática para a última mensagem.
3. **Sugestões rápidas** (só no início): "Aceita financiamento?", "Qual o condomínio?", "Quero agendar uma visita".
4. **Campo de mensagem** + botão enviar (`aria-label="Enviar mensagem"`); Enter envia, Shift+Enter quebra linha.
5. **Rodapé** em texto pequeno: "Assistente virtual. Ver privacidade."

### 4.3 Regras

- Carregada com `next/dynamic` (`ssr: false`) depois da página (RNF-03).
- Id da conversa no `localStorage` dentro de `try/catch`; se falhar, a conversa funciona sem retomada.
- Mensagens do atendente renderizadas como texto simples com quebras de linha (sem HTML vindo do modelo).
- Evento `chat_aberto` ao abrir pela primeira vez na sessão.

---

## 5. E-mails

Templates em `src/emails/` com React Email, mesmas cores e fontes (com fallback para Arial).

| E-mail | Destinatário | Conteúdo |
| --- | --- | --- |
| Link de acesso | Corretor | Botão "Entrar no painel", validade do link |
| Nova visita | Corretor | Imóvel, data e hora, nome, contato, pagamento, prazo, perguntas pendentes, botão "Ver no painel" |
| Conversa transferida | Corretor | Imóvel, pergunta que o atendente não soube responder, contato (se houver) |
| Pedido de visita recebido | Comprador | Imóvel, data e hora pedidas, nome e CRECI do corretor, "O corretor vai confirmar" |

---

## 6. Checklist antes de dar uma página por pronta

- [ ] Funciona em 390 px e em 1280 px
- [ ] Estados de carregando, vazio e erro implementados
- [ ] Navegação por teclado e foco visível
- [ ] Textos em português, sem placeholder esquecido
- [ ] Lighthouse ≥ 90 em desempenho e SEO (páginas públicas)
- [ ] Nenhum dado pessoal em logs ou eventos