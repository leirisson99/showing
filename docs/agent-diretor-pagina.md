Spec — Agente Diretor da Página
Nov 20, 2026 · @Leirisson Souza dos santos
Visão geral
O Diretor da Página é o agente que transforma o cadastro de um imóvel (ficha, fotos e perfil do corretor) em um roteiro: um JSON que escolhe um template, ordena os capítulos, escreve os textos e associa as mídias. Quem desenha a página é o front-end, a partir do roteiro. O agente nunca escreve HTML, CSS ou JavaScript.
Escopo
• Gera a página pública de um único imóvel (/imovel/[slug]), contada em capítulos com motion no scroll.
• Roda no painel, quando o corretor termina o cadastro ou pede "Gerar de novo".
• Entrega um rascunho. Nada é publicado sem a revisão do corretor (RN-06).
Fora do escopo
• O chat com o comprador (é o agente Atendente, com outra spec).
• Escrever código de página, criar layouts novos ou estilos fora do design system.
• Inventar qualquer dado do imóvel ou do bairro.
Princípios
1.  Só dado cadastrado. Toda afirmação sobre o imóvel aponta para um campo da ficha ou para uma foto. Sem dado, sem frase.
2.  Roteiro, não código. O agente escolhe entre templates e capítulos já testados. Toda página fica diferente e nenhuma quebra.
3.  Foto fiel ao imóvel. Ajuste fotográfico, sim. Alterar o imóvel, nunca.
4.  O corretor aprova. O agente propõe; o corretor revisa, edita e publica.
5.  Leve no celular. A página tem que carregar rápido e rodar liso num celular comum.
Entradas e saídas
O agente recebe três coisas e devolve uma: o roteiro validado, mais as mídias processadas.
Entrada
De onde vem
Campos usados
Ficha do imóvel
Cadastro (imovel)
tipo, finalidade, bairro, cidade, preço, condomínio, IPTU, quartos, suítes, banheiros, vagas, área, financiamento, FGTS, características, informações adicionais, info do bairro
Fotos
Upload do corretor (mínimo 3, RN-02)
arquivo, ordem escolhida pelo corretor, legenda (se houver)
Perfil do corretor
/painel/perfil
nome, CRECI, foto, cor da marca (primary), WhatsApp
Saída
Formato
Onde fica
Roteiro
JSON validado pelo schema (seção "Schema do roteiro")
Tabela roteiro, versão por geração
Fotos processadas
Variantes otimizadas (AVIF/WebP, 3 larguras) + original preservado
Storage, ligadas ao id da foto original
Vídeo do hero (opcional)
MP4 H.264 + poster, montado por código
Storage
Relatório de geração
Lista de campos usados, campos faltando, alertas
Mostrado ao corretor na revisão
Campos faltando não viram texto. Se o corretor não preencheu o condomínio, o roteiro não fala de condomínio, e o relatório pede o dado: "Preencha o valor do condomínio para aparecer na página e o assistente responder".
Sistema de templates
Toda página nasce de um template (a sequência e o tom) montado com tipos de capítulo (os blocos com motion já testados). O agente escolhe o template, pode tirar capítulos opcionais e reordenar os do meio, mas não inventa capítulo novo.
Templates de página
Template
Quando usar
Sequência de capítulos
familia
Casa ou apartamento com 3+ quartos, área externa ou bairro residencial
hero_video → numeros → ambientes_fixo → galeria_horizontal → bairro → duvidas → cta_visita
compacto
Studio, 1–2 quartos, imóvel urbano
hero_imagem → numeros → destaques → galeria_horizontal → bairro → duvidas → cta_visita
alto_padrao
Preço acima do limite configurado ou muitos diferenciais
hero_video → manifesto → ambientes_fixo → galeria_horizontal → destaques → bairro → duvidas → cta_visita
essencial
Poucas fotos (3–5) ou ficha incompleta
hero_imagem → numeros → galeria_grade → bairro → duvidas → cta_visita
Regra de escolha: o agente propõe o template e explica em uma frase no relatório. O corretor pode trocar na revisão. Com menos de 6 fotos boas, essencial é obrigatório, porque ambientes_fixo e galeria_horizontal ficam vazios.
Tipos de capítulo
Tipo
O que mostra
Motion padrão
Pede
hero_video
Vídeo montado das fotos + título + cartão de preço
título palavra por palavra; zoom e paralaxe no scroll
3+ fotos externas ou de sala
hero_imagem
Foto de capa em tela cheia + título + preço
zoom lento no scroll
1 foto boa
manifesto
Uma frase grande sobre o imóvel em fundo neutro
revelação por palavra
1 diferencial forte cadastrado
numeros
3 números grandes (quartos, área, vagas ou outros)
contagem até o valor
campos numéricos preenchidos
ambientes_fixo
Tela fixa: fotos trocam no scroll, uma frase por ambiente
crossfade + barras de progresso
3–5 fotos de ambientes diferentes
destaques
3–6 cartões de características (ícone + título + linha)
entrada escalonada
características cadastradas
galeria_horizontal
Fotos em linha, movidas pelo scroll vertical
trilho horizontal + foto central em destaque
5+ fotos
galeria_grade
Grade simples de fotos
entrada escalonada
3+ fotos
bairro
Mapa da região aproximada + info do bairro
mapa aproxima até a região
bairro e cidade; info do bairro opcional
duvidas
Cartões de pergunta + chat
cartões sobem; chat entra
sempre
cta_visita
Chamada final, corretor e "Agendar visita"
título e botão entram
sempre
duvidas e cta_visita são obrigatórios e ficam sempre no fim. O hero é sempre o primeiro.
Presets de movimento
Cada capítulo aceita um movimento dentro de uma lista fechada: suave (padrão), marcante (amplitudes maiores, para alto_padrao) e minimo (só opacidade). Durações, curvas e distâncias de cada preset ficam no front-end, não no roteiro.
Schema do roteiro
O roteiro é validado com Zod no servidor antes de ser salvo. Um roteiro inválido volta para o agente com o erro, no máximo 2 vezes; na terceira falha, a geração para e o corretor vê "Não consegui montar a página. Tente de novo".
const Movimento = z.enum(["suave", "marcante", "minimo"]).default("suave");
const Icone = z.string(); // nome de um ícone do lucide-react, de uma lista permitida

const Fonte = z.object({
  campo: z.string(),            // ex.: "imovel.quartos", "imovel.caracteristicas[2]", "foto:f3"
});

const Texto = z.object({
  texto: z.string().max(140),
  fontes: z.array(Fonte).min(1), // toda frase aponta para o que a sustenta
});

const Capitulo = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("hero_video"), titulo: Texto, video: z.string(), poster: z.string(), movimento: Movimento }),
  z.object({ tipo: z.literal("hero_imagem"), titulo: Texto, foto: z.string(), movimento: Movimento }),
  z.object({ tipo: z.literal("manifesto"), frase: Texto, movimento: Movimento }),
  z.object({ tipo: z.literal("numeros"), titulo: Texto, itens: z.array(z.object({ campo: z.string(), rotulo: z.string() })).length(3), movimento: Movimento }),
  z.object({ tipo: z.literal("ambientes_fixo"), quadros: z.array(z.object({ foto: z.string(), rotulo: z.string().max(24), frase: Texto })).min(3).max(5), movimento: Movimento }),
  z.object({ tipo: z.literal("destaques"), titulo: Texto, itens: z.array(z.object({ icone: Icone, titulo: z.string().max(32), linha: Texto })).min(3).max(6), movimento: Movimento }),
  z.object({ tipo: z.literal("galeria_horizontal"), titulo: Texto, fotos: z.array(z.string()).min(5).max(12), movimento: Movimento }),
  z.object({ tipo: z.literal("galeria_grade"), titulo: Texto, fotos: z.array(z.string()).min(3).max(12), movimento: Movimento }),
  z.object({ tipo: z.literal("bairro"), titulo: Texto, movimento: Movimento }),
  z.object({ tipo: z.literal("duvidas"), titulo: Texto, perguntas: z.array(z.object({ rotulo: z.string(), pergunta: z.string() })).min(3).max(6), movimento: Movimento }),
  z.object({ tipo: z.literal("cta_visita"), titulo: Texto, movimento: Movimento }),
]);

export const Roteiro = z.object({
  versao: z.literal(1),
  template: z.enum(["familia", "compacto", "alto_padrao", "essencial"]),
  motivoTemplate: z.string().max(200),
  persona: z.enum(["familia", "casal", "investidor", "primeiro_imovel", "geral"]),
  seo: z.object({ title: z.string().max(60), description: z.string().max(155) }),
  capitulos: z.array(Capitulo).min(5).max(9),
  alertas: z.array(z.string()), // campos faltando, fotos ruins, etc.
});
Regras que o schema não pega e o validador do servidor confere:
• Todo campo em fontes existe na ficha e está preenchido. Todo id de foto existe.
• O primeiro capítulo é um hero; os dois últimos são duvidas e cta_visita, nessa ordem.
• A sequência respeita o template escolhido (só pode tirar opcionais e trocar a ordem dos do meio).
• Uma foto não se repete em dois capítulos, exceto a capa.
Exemplo
{
  "versao": 1,
  "template": "familia",
  "motivoTemplate": "Casa com 3 quartos, quintal e bairro residencial.",
  "persona": "familia",
  "seo": { "title": "Casa 3 quartos no [Bairro] — [Cidade]", "description": "Casa com quintal e 2 vagas. Tire dúvidas e agende sua visita com o corretor." },
  "capitulos": [
    { "tipo": "hero_video", "titulo": { "texto": "Uma casa com quintal para o fim de semana.", "fontes": [{ "campo": "imovel.caracteristicas[0]" }] }, "video": "v_hero", "poster": "f1", "movimento": "suave" },
    { "tipo": "numeros", "titulo": { "texto": "Espaço para a rotina inteira.", "fontes": [{ "campo": "imovel.area" }] }, "itens": [{ "campo": "imovel.quartos", "rotulo": "quartos" }, { "campo": "imovel.area", "rotulo": "m²" }, { "campo": "imovel.vagas", "rotulo": "vagas" }], "movimento": "suave" },
    { "tipo": "ambientes_fixo", "quadros": [
      { "foto": "f3", "rotulo": "A sala", "frase": { "texto": "Sala integrada à cozinha.", "fontes": [{ "campo": "imovel.caracteristicas[1]" }, { "campo": "foto:f3" }] } },
      { "foto": "f5", "rotulo": "Os quartos", "frase": { "texto": "Três quartos, um deles suíte.", "fontes": [{ "campo": "imovel.quartos" }, { "campo": "imovel.suites" }] } },
      { "foto": "f8", "rotulo": "Lá fora", "frase": { "texto": "Quintal com churrasqueira.", "fontes": [{ "campo": "imovel.caracteristicas[0]" }] } }
    ], "movimento": "suave" },
    { "tipo": "galeria_horizontal", "titulo": { "texto": "Cada canto, em detalhe.", "fontes": [{ "campo": "fotos" }] }, "fotos": ["f2", "f4", "f6", "f7", "f9"], "movimento": "suave" },
    { "tipo": "bairro", "titulo": { "texto": "Escola e mercado perto de casa.", "fontes": [{ "campo": "imovel.infoBairro.escolas" }, { "campo": "imovel.infoBairro.mercados" }] }, "movimento": "suave" },
    { "tipo": "duvidas", "titulo": { "texto": "Ficou alguma dúvida? Pergunte agora.", "fontes": [{ "campo": "sistema" }] }, "perguntas": [
      { "rotulo": "01 / Financiamento", "pergunta": "Aceita financiamento e FGTS?" },
      { "rotulo": "02 / Custos", "pergunta": "O que o condomínio inclui?" },
      { "rotulo": "03 / Visita", "pergunta": "Quero agendar uma visita" }
    ], "movimento": "suave" },
    { "tipo": "cta_visita", "titulo": { "texto": "Que tal ver de perto?", "fontes": [{ "campo": "sistema" }] }, "movimento": "suave" }
  ],
  "alertas": ["IPTU não preenchido: não aparece na página."]
}
Textos de sistema (títulos de duvidas e cta_visita) usam "campo": "sistema", porque não afirmam nada sobre o imóvel.
Pipeline e tools
O roteiro reprovado volta para o agente reescrever (no máximo 2 vezes), e o pedido de ajuste do corretor também volta para o roteiro. A publicação é sempre uma ação do corretor.
Tools do agente
Tool
Entrada
Retorna
Regra
ler_cadastro
—
Ficha, fotos e perfil do corretor
O imóvel vem da sessão do servidor, nunca de argumento
analisar_fotos
—
Por foto: ambiente, qualidade, ponto focal sugerido, motivo de descarte
Usa modelo de visão; não altera arquivos
ajustar_foto
foto_id, ajustes (lista fechada: exposição, cor, horizonte, nitidez, recorte)
Id da variante gerada
Recusa qualquer ajuste fora da lista; original sempre preservado
montar_video_hero
fotos (3–5 ids), duracao (8–12 s)
Id do vídeo e do poster
Fila (BullMQ); resposta assíncrona
validar_roteiro
roteiro
Lista de erros ou "ok"
Roda schema, validador de regras e checagem de fidelidade
salvar_rascunho
roteiro, relatorio
Id da versão
Só aceita roteiro que passou em validar_roteiro
Não existe tool de publicar: publicar é um botão do corretor no painel.
Regras de texto e storytelling
O texto conta a visita na ordem em que ela acontece: chegar, entrar, conhecer os ambientes, olhar o bairro, tirar dúvidas, marcar. Cada capítulo responde a uma pergunta do comprador.
Voz
• Português do Brasil, segunda pessoa implícita, frases curtas. O título de capítulo tem no máximo 9 palavras.
• Concreto antes de bonito: "Três quartos, um deles suíte" ganha de "Conforto para toda a família".
• A persona muda o que se destaca, não o que é verdade. Para familia, quintal e escola; para investidor, área, condomínio e localização.
Proibido
• Qualquer fato sem campo de origem em fontes. "Luz o dia todo", "vista definitiva" ou "rua tranquila" só com o campo que diz isso.
• Superlativos sem prova: "o melhor", "único", "imperdível", "oportunidade única".
• Urgência falsa: "últimas unidades", "corre que acaba".
• Preço ou condição diferente da ficha; promessa de desconto ou negociação.
• Endereço completo, número ou complemento, quando o corretor não liberou (RN-05).
• Emoji, caixa alta em frase inteira, ponto de exclamação em sequência.
• Termos que excluem pessoas ("ideal para casal sem filhos", "bairro de gente bonita").
Cartões de pergunta (duvidas)
• Só perguntas que o Atendente consegue responder com a ficha. "Aceita FGTS?" só aparece se o campo FGTS estiver preenchido.
• A última pergunta é sempre "Quero agendar uma visita".
• Rótulo no formato NN / Tema, como nos prompts do Sidekick que inspiraram o padrão.
SEO
• title: tipo + quartos + bairro + cidade, até 60 caracteres.
• description: dois fatos da ficha + o convite para conversar ou agendar, até 155 caracteres.
Regras de imagem e vídeo
A foto pode ficar melhor, mas o imóvel não pode ficar diferente. Alterar o imóvel na foto pode ser propaganda enganosa e se volta contra o corretor na visita.
Ação
Regra
Como aparece
Exposição, contraste, balanço de branco
Automático
Sem aviso
Endireitar horizonte e verticais
Automático
Sem aviso
Nitidez, redução de ruído, aumento de resolução
Automático, sem inventar detalhe
Sem aviso
Recorte para o enquadramento do capítulo
Automático, ponto focal escolhido pelo agente
O corretor pode mover o ponto focal
Mobiliar virtualmente um cômodo vazio
Só se o corretor pedir
Selo "Imagem ilustrativa" + original ao lado
Trocar o céu, apagar defeito, mudar parede, piso ou vista
Proibido
—
Remover pessoas, placas, objetos pessoais
Permitido se não alterar o imóvel
Sem aviso
Análise das fotos (antes de editar)
• Classificar cada foto: ambiente (fachada, sala, cozinha, quarto, banheiro, área externa, vista, outros) e qualidade (boa, aceitável, descartar).
• Descartar fotos tremidas, escuras demais, duplicadas ou com pessoas identificáveis. O relatório diz quais e por quê.
• Sugerir a capa: a melhor foto externa ou de sala. O corretor pode trocar.
• A legenda do corretor vira o alt; sem legenda, o agente escreve um alt descritivo do que está na foto.
Vídeo do hero
• Montado por código (Remotion ou FFmpeg) com as fotos reais: movimentos de câmera lentos (zoom, deslocamento lateral), 3–5 fotos, 8–12 s em loop, sem áudio.
• Saída: MP4 H.264 até 2,5 MB em 1080p e 1 MB em 720p para celular, mais o poster em AVIF.
• Vídeo gerado por modelo de IA (imagem para vídeo) fica para a fase 3, só com aprovação do corretor quadro a quadro, porque pode inventar janela, porta ou parede.
Banners de divulgação (fase 3)
• Stories 1080 × 1920 e feed 1080 × 1350, com foto, preço, bairro e o link curto da página.
• Mesmas regras de texto e de imagem da página.
Motion, desempenho e acessibilidade
O motion é do front-end; o agente só escolhe o preset. Estas regras valem para os componentes de capítulo e são o limite do que o roteiro pode pedir.
Motion
• Biblioteca: GSAP + ScrollTrigger com Lenis, ou Motion (antigo Framer Motion). Uma só no projeto.
• Animar apenas transform e opacity. Nada de animar width, top, filter ou sombra no scroll.
• Barra de capítulos fixa no topo com o capítulo atual e o progresso; cada capítulo clicável.
• Referência visual: os protótipos "Página em capítulos" (mobile e desktop) no canvas Showing — POC.
Desempenho
• Lighthouse ≥ 90 em desempenho no celular (perfil Moto G Power, 4G lenta).
• LCP ≤ 2,5 s: o poster do hero carrega com prioridade; o vídeo só depois, e só se a conexão permitir (navigator.connection.saveData desliga o vídeo).
• Fotos via next/image em AVIF/WebP com sizes corretos; capítulos abaixo da dobra carregam sob demanda.
• No máximo 1 vídeo por página. JavaScript da página (sem o chat) até 120 KB comprimido.
• O chat (ChatBubble) carrega depois da página, com next/dynamic (RNF-03).
Acessibilidade
• prefers-reduced-motion: reduce: sem paralaxe, zoom, contagem ou trilho horizontal. Os capítulos fixos viram blocos estáticos empilhados. Todo conteúdo continua acessível.
• Nada fica escondido esperando o scroll: com JavaScript desligado, a página mostra todo o texto e todas as fotos.
• Texto sobre foto sempre com camada escura que garante contraste de 4,5:1.
• Títulos em ordem (um h1 no hero, h2 por capítulo); alt em toda foto; o vídeo é decorativo e mudo, com o poster como alt.
• O chat e o "Agendar visita" ficam acessíveis em qualquer ponto da página.
Validação, revisão e critérios de aceite
Um roteiro só chega ao corretor depois de passar por três filtros; só vai ao ar depois que ele publica.
1.  Schema (Zod): formato, limites de tamanho, enums.
2.  Validador de regras (código): campos de fontes existem e estão preenchidos; ordem dos capítulos; fotos sem repetição; lista de palavras proibidas (superlativos, urgência, endereço).
3.  Checagem de fidelidade (segunda chamada de modelo, barata): recebe a ficha e cada frase, e responde se a frase afirma algo que a ficha não sustenta. Frase reprovada volta para o agente reescrever.
Revisão do corretor (na pré-visualização)
• Ver a página exatamente como o comprador verá, com o motion.
• Editar qualquer texto no lugar; trocar a capa e o ponto focal das fotos; trocar o template; tirar capítulos opcionais.
• Pedir "Gerar de novo" com uma instrução curta ("destaque o quintal").
• Ver o relatório: campos faltando, fotos descartadas, alertas.
• Publicar. Edições do corretor nunca são sobrescritas por uma nova geração sem confirmação.
Critérios de aceite
[ ] 10 imóveis reais do piloto geram roteiros válidos na primeira ou segunda tentativa.
[ ] Zero frases sem campo de origem na amostra revisada à mão.
[ ] Nenhuma foto com o imóvel alterado (comparação com o original).
[ ] Lighthouse ≥ 90 no celular em todas as páginas geradas.
[ ] Com movimento reduzido, a página mostra todo o conteúdo, sem animação.
[ ] Geração completa (sem vídeo) em até 90 s; com vídeo, até 4 min, com progresso visível para o corretor.
[ ] Corretor consegue editar, regerar e publicar sem ajuda.
Fases e questões em aberto
Comece pela fase 1: ela já entrega a página em capítulos com as fotos originais, que é o diferencial.
1.  Fase 1 — Roteiro e capítulos. Templates familia e essencial; capítulos hero_imagem, numeros, ambientes_fixo, galeria_horizontal, bairro, duvidas, cta_visita; fotos originais só otimizadas; revisão do corretor. Passa para a fase 2 quando: os critérios de aceite fecham com os 3 corretores do piloto.
2.  Fase 2 — Fotos e vídeo. Ajuste fotográfico automático, ponto focal, hero_video montado por código; templates compacto e alto_padrao; manifesto e destaques. Passa para a fase 3 quando: nenhuma reclamação de foto "diferente do imóvel" nas visitas.
3.  Fase 3 — Divulgação e IA de vídeo. Banners de stories e feed; vídeo gerado por modelo de IA com aprovação quadro a quadro; mobiliar virtualmente com selo.
Questões em aberto
[ ] Qual preço define alto_padrao? Valor fixo ou relativo ao bairro?
[ ] Info do bairro: só cadastro manual na fase 1, ou buscar escolas e mercados numa API e o corretor revisar?
[ ] O corretor pode subir vídeo próprio para o hero, no lugar do montado?
[ ] Qual modelo roda o agente e qual roda a checagem de fidelidade (custo por página gerada)?
[ ] Nome final do produto e logo, que aparecem no rodapé "Página criada com Showing".