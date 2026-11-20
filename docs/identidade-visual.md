# Identidade visual — Showing (nome provisório)

Complementa o design system de [pages.md](pages.md) (cores, tipografia, componentes). Este arquivo diz **o que a marca é e como usá-la**; os tokens ficam em `src/app/globals.css`.

## Conceito

**Uma conversa que abre a porta.** O produto junta duas coisas: a página do imóvel e o atendente que conversa com o comprador. A marca une as duas: um **balão de conversa em forma de casa**, com a **porta acesa em âmbar**. O âmbar é o "visita marcada".

Personalidade: confiável, direta, cordial, local. Fala como um bom corretor: claro, sem enrolação, sem promessa que não pode cumprir.

## Modelos de layout

Os modelos estão em `layouts/` (`layout-1.webp` e `layout-2.jpeg`): páginas de anúncio de imóvel de alto padrão. Todas as páginas públicas seguem essa linguagem, adaptada ao Showing (que apresenta qualquer imóvel, não um só):

- **Fundo creme**, faixas **verde-floresta escuro** e botões **bronze** em pílula.
- **Hero** em tela cheia com foto (ou vídeo) escurecida à esquerda, cabeçalho por cima (marca, links, "Login" e botão), título grande, dois botões e um selo.
- **Cartões sobrepostos** com foto, numerados (01, 02, 03), subindo sobre a base do hero.
- **Seção de introdução** com texto e um cartão ao lado; **ficha técnica** em cartão claro com foto; **lista numerada** com setas ("Detalhes importantes"); **FAQ** em acordeão; **galeria** em grade; **faixa de chamada** escura; **rodapé** areia.
- Cantos bem arredondados (cartões 24 a 28 px, botões em pílula).

Onde cada modelo aparece: a página do imóvel (`/imovel/[slug]`) segue o modelo 2 inteiro, com os dados do anúncio; a página inicial usa o hero e os cartões do modelo 2 e a faixa escura de cartões com foto do modelo 1 (o atendente). Blocos compartilhados: `src/components/site/`.

Os modelos são referência de estilo: nada deles (nome, textos, imagens) é reproduzido. Sem dados inventados: nada de nota de avaliação, prêmio ou número que o produto não tenha.

## Logotipo

- **Marca:** balão de conversa verde-floresta com uma casa branca e a porta em ouro. Código em `src/components/brand/Logo.tsx` (`LogoMarca` e `Logo`); a mesma arte está em `src/app/icon.svg` (favicon).
- **Assinatura:** marca + "Showing" em Cormorant Garamond 600.
- **Cores:** sobre fundo claro, balão em `--primary`; sobre fundo escuro, branco (herda `currentColor`). A porta é sempre `#C9A66B`.
- **Área de respiro:** pelo menos a largura da porta em todos os lados. **Tamanho mínimo:** marca sozinha 16 px; assinatura 96 px de largura.
- **Não fazer:** girar, esticar, trocar a cor da porta, pôr sombra ou contorno, usar sobre foto sem contraste.

## Cores

Tokens em `src/app/globals.css`; tabela completa em [pages.md](pages.md#22-cores).

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#F4F1EA` | Fundo creme |
| `--primary` | `#1F3A2B` | Verde-floresta: marca, botões escuros |
| `--cta` | `#7A5A3A` | Bronze: ação principal (texto branco, contraste AA) |
| `--brand-deep` | `#1B2F24` | Faixas escuras |
| `--brand-sand` | `#D9D5C6` | Rodapé |
| Ouro | `#C9A66B` | Só detalhes sobre fundo escuro (rótulos, selo, porta da marca) |

Texto sobre fundo escuro: branco, ou branco a 75 a 85% para apoio.

## Tipografia

Manrope em títulos e texto; Cormorant Garamond só no nome da marca. Títulos com `tracking-tight` e `text-balance`. Rótulos de seção em caixa alta, bronze (`text-cta`), 14 px, semibold.

## Linguagem e tom

- Português do Brasil, frases curtas, verbos de ação ("Entrar como corretor", "Agendar visita").
- Nada de promessa vaga ("revolucione") nem de número inventado. Exemplos na tela vêm sempre marcados como **"Exemplo ilustrativo"**.
- Sem emoji. Ícones só do `lucide-react`.

## Imagens e ilustração

- Imóvel: sempre fotos reais enviadas pelo corretor, com `next/image` e `alt` descritivo.
- Hero da página inicial: vídeo de exemplo; as demais fotos são ilustrativas do Unsplash (`docs/creditos-imagens.md`).
- Maquetes de tela (página, conversa, e-mail) usam os componentes reais de cores e tipografia.

## Movimento

Princípios: calmo, curto e a serviço da leitura. Nada de bounce, nada que atrapalhe ler.

- **Página inicial:** abre com um hero de vídeo em tela cheia, escurecido à esquerda por um degradê, título que entra letra por letra e textos com fade escalonado (200, 800, 1200 e 1400 ms). Depois vem a história rolável "Como funciona", em três cenas (a página, o atendente, a visita): a rolagem controla a entrada de cada cena e a chegada das falas do chat. Sem biblioteca: `HistoriaScroll` escreve só `--sp` (progresso 0 a 1) e `data-fase`; o movimento é CSS (`globals.css`).
- **Vídeo do hero:** é um vídeo de exemplo (cidade ao entardecer) hospedado em CDN externo (`src/components/home/Hero.tsx`). Trocar por um vídeo próprio antes de divulgar.
- **Acessibilidade:** com `prefers-reduced-motion` o vídeo fica parado, o título e os fades aparecem de uma vez e a história vira uma sequência normal de seções; sem JavaScript também, com todo o conteúdo no HTML. O título animado tem uma cópia em texto (`sr-only`) para leitores de tela e buscadores. Cenas fora de vista ficam `visibility: hidden` (sem foco).
- **Fora da página inicial:** transições de 100 a 200 ms (padrão do shadcn). A bolha e o painel não usam rolagem animada.
- **Quando usar GSAP:** as skills `gsap-*` e `cinematic-scroll-storytelling` estão instaladas, mas a página inicial não precisa de biblioteca. Só adicionar `gsap` se surgir uma animação que o CSS não resolva.

## Fora da página inicial

A POC prioriza o atendente e a bolha de chat. Aplicar a identidade no painel e na página do imóvel é opcional: logotipo no cabeçalho do painel e a cor da bolha já seguem os tokens.
