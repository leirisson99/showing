# Conteúdos de divulgação por funcionalidade

Público: corretores de imóveis de Blumenau (piloto de 4 semanas).
Cada funcionalidade tem um cartão (1080×1080, serve para LinkedIn e Instagram) em `features/`, uma legenda para as redes e uma mensagem curta para WhatsApp.

Regras do kit: só prometemos o que o produto faz hoje. Sem números de resultado (o piloto ainda não mediu nada), sem citar preço, WhatsApp ou Google Agenda (fora da POC). O cartão 06 usa números de exemplo e avisa isso na própria imagem.

Para refazer os cartões: `node docs/divulgacao/gerar-cartoes.mjs`.

Link usado em todos: https://showing.foliumdev.com.br/cadastro
(Se o cadastro estiver com `CADASTRO_CODIGO`, não publique o link. Peça contato no direct e mande o convite.)

---

## 1. Página exclusiva do imóvel
Cartão: `features/01-pagina-exclusiva.png`

**Legenda**
Anúncio em portal se perde no meio de milhares de outros. Com o Showing, cada imóvel ganha uma página só dele, com fotos, características, bairro e um endereço fácil de compartilhar no WhatsApp, no Instagram ou onde você quiser.

Você cadastra uma vez. A página fica pronta para receber interessados.

Piloto aberto para corretores de Blumenau: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** Cada imóvel seu ganha uma página própria, pronta para mandar ao cliente. Quer testar no piloto? https://showing.foliumdev.com.br/cadastro

---

## 2. Atendente de IA dentro da página
Cartão: `features/02-atendente-na-pagina.png`

**Legenda**
O interessado fica com dúvida às 22h. Você está dormindo, ou numa visita, ou numa reunião.

Na página do imóvel tem um atendente virtual que responde na hora, em português, com mensagens curtas. Ele se apresenta como assistente do corretor e conduz a conversa até o interessado querer ver o imóvel.

Você não perde o momento em que a pessoa está mais interessada.

Quer testar? Piloto em Blumenau: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** O atendente da página responde as dúvidas do interessado na hora, mesmo quando você não pode. Posso te mostrar?

---

## 3. Visita nos horários que você escolheu
Cartão: `features/03-visita-agendada.png`

**Legenda**
Marcar visita costuma virar um vai e vem de mensagens: "que dia você pode?", "e sábado?", "às quantas?".

No Showing você define seus horários de visita no perfil, uma vez. O atendente só oferece esses horários, o interessado escolhe e a visita fica como pedida. Quem confirma é você.

Menos troca de mensagem, mais visita acontecendo.

Piloto aberto em Blumenau: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** Você cadastra seus horários de visita e a IA só oferece o que está livre. Você confirma. Quer testar no piloto?

---

## 4. Resumo por e-mail
Cartão: `features/04-resumo-por-email.png`

**Legenda**
Ler a conversa inteira para descobrir o que o cliente quer toma tempo.

Quando alguém pede uma visita ou quando a IA precisa de você, chega um e-mail com o resumo: quem é, quando quer ver o imóvel e o que perguntou. É só abrir o painel, conferir e confirmar.

Você chega na visita sabendo o que o cliente quer.

Teste no piloto: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** Pediu visita? Você recebe um e-mail com o resumo: quem é, quando e o que perguntou. Sem ler a conversa toda.

---

## 5. A IA não inventa
Cartão: `features/05-ia-que-nao-inventa.png`

**Legenda**
A maior dúvida de quem ouve "atendente de IA" é: e se ela inventar algo?

No Showing, a IA responde só com os dados da ficha do imóvel e do bairro. Não inventa preço, condomínio, metragem ou condição. Não negocia valor e não promete aprovação de financiamento. Quando a informação não está na ficha, ela avisa que vai confirmar com o corretor e encaminha a conversa para você.

A IA atende. Quem decide é você.

Piloto em Blumenau: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** A IA só responde o que está na ficha do imóvel. Se não souber, ela te chama. Não inventa preço nem condição.

---

## 6. Painel do corretor
Cartão: `features/06-painel-do-corretor.png` (números de exemplo, avisado na imagem)

**Legenda**
Postar o imóvel e torcer não é estratégia. Dá para acompanhar o que acontece.

No painel você vê, por imóvel, quantas pessoas visitaram a página, quantas conversaram com o atendente, quantas deixaram contato e quantas pediram visita. Também tem a lista de visitas, as conversas e os seus clientes, tudo no mesmo lugar.

Os números ajudam a decidir onde investir seu tempo.

Piloto aberto: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** No painel você vê quantas pessoas viram cada imóvel, quantas conversaram e quantas pediram visita. Quer testar?

---

## 7. Título e descrição prontos para revisar
Cartão: `features/07-texto-pronto-para-revisar.png`

**Legenda**
Escrever título e descrição de cada imóvel é uma tarefa que ninguém quer fazer.

No Showing você preenche a ficha e a IA monta um rascunho do título e da descrição, usando só os dados que você informou. Você revisa, ajusta e aprova antes de publicar.

Ela escreve o rascunho. O texto final é seu.

Piloto em Blumenau: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** A IA escreve o título e a descrição do imóvel a partir da ficha. Você só revisa e aprova.

---

## 8. Privacidade de quem pergunta
Cartão: `features/08-privacidade-do-comprador.png`

**Legenda**
Quem conversa com o atendente também merece clareza sobre os próprios dados.

Antes de guardar nome ou telefone, a bolha pergunta e o interessado escolhe: "Pode guardar" ou "Prefiro não". Os dados ficam visíveis só para o corretor dono do imóvel e podem ser apagados quando a pessoa pedir.

Isso protege o cliente e você, que atende dentro da LGPD.

Piloto em Blumenau: https://showing.foliumdev.com.br/cadastro

**WhatsApp:** O atendente só guarda o contato de quem autorizar, e os dados ficam só com você. Tudo dentro da LGPD.

---

## Sugestão de calendário (2 semanas)

| Dia | Cartão |
|---|---|
| Seg, semana 1 | 02 Atendente na página (o mais fácil de entender) |
| Qui, semana 1 | 05 A IA não inventa (derruba a principal objeção) |
| Seg, semana 2 | 03 Visita agendada |
| Qui, semana 2 | 04 Resumo por e-mail |
| Depois | 01, 06, 07 e 08, intercalando com depoimentos dos corretores do piloto |

Dica: a partir da segunda semana do piloto, troque os cartões por prints e relatos reais de quem estiver testando (com autorização), que convencem mais do que texto de produto.

Hashtags sugeridas: #corretordeimoveis #mercadoimobiliario #blumenau #inteligenciaartificial #proptech
