# Entidades, regras de negócio e requisitos — POC

Escopo: POC da página do imóvel com atendente IA (nome provisório: Showing). Documento de referência para o desenvolvimento; veja também `README.md` e `CLAUDE.md`.

---

## 1. Entidades

### 1.1 Corretor

Quem usa o painel, cadastra imóveis e recebe as visitas. Na implementação, é o `User` do Auth.js com campos extras.

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| id | string (cuid) | sim | |
| nome | string | sim | Exibido na página e na bolha de chat |
| email | string | sim | Único; usado no login por link mágico e nos avisos |
| creci | string | sim | Exibido na página do imóvel |
| whatsapp | string | não | Exibido na página; não é usado pelo atendente na POC |
| fotoFileId | string | não | Foto do corretor no Appwrite (avatar da bolha) |
| horariosVisita | JSON | sim | Ex.: `{ "sab": ["09:00", "10:00"], "dom": ["10:00"] }` |
| duracaoVisitaMin | int | sim | Padrão 60 |
| criadoEm | datetime | sim | |

### 1.2 Imovel

O imóvel anunciado, com página pública própria.

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| id | string (cuid) | sim | |
| corretorId | string | sim | FK → Corretor |
| slug | string | sim | Único; vira a URL `/imovel/[slug]` |
| tipo | enum `TipoImovel` | sim | apartamento, casa, terreno, sala_comercial |
| finalidade | enum `Finalidade` | sim | venda, aluguel |
| titulo | string | sim | Gerado pela IA, editável |
| descricao | text | sim | Gerada pela IA, editável |
| bairro | string | sim | |
| cidade | string | sim | Padrão "Blumenau" |
| endereco | string | não | Endereço completo; ver RN-05 |
| latitude / longitude | decimal | não | Para o mapa |
| preco | decimal | sim | Em reais |
| condominio | decimal | não | |
| iptu | decimal | não | Valor anual |
| quartos | int | sim | |
| suites | int | não | |
| banheiros | int | sim | |
| vagas | int | sim | |
| areaM2 | decimal | sim | Área privativa |
| aceitaFinanciamento | boolean | sim | |
| aceitaFgts | boolean | não | |
| caracteristicas | string[] | não | Ex.: "sacada com churrasqueira", "piscina" |
| infoAdicional | text | não | Texto livre do corretor que o atendente pode usar |
| status | enum `StatusImovel` | sim | rascunho, publicado, vendido |
| publicadoEm | datetime | não | |
| criadoEm / atualizadoEm | datetime | sim | |

### 1.3 Foto

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| id | string (cuid) | sim | |
| imovelId | string | sim | FK → Imovel |
| fileId | string | sim | Id do arquivo no Appwrite Storage |
| ordem | int | sim | 0 = foto de capa |
| legenda | string | não | Usada como `alt` da imagem |

### 1.4 Conversa

Um atendimento na bolha de chat. O comprador (lead) fica dentro da conversa na POC.

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| id | string (cuid) | sim | Também guardado no `localStorage` do comprador |
| imovelId | string | sim | FK → Imovel |
| mensagens | JSON | sim | Histórico no formato do Strands Agents |
| perfilLead | JSON | não | `{ nome, telefone, email, pagamento, prazo }` |
| consentimento | boolean | sim | Padrão `false`; ver RN-11 |
| consentimentoEm | datetime | não | |
| transferida | boolean | sim | `true` quando o atendente passou para o corretor |
| motivoTransferencia | string | não | |
| status | enum `StatusConversa` | sim | ativa, encerrada |
| criadaEm / atualizadaEm | datetime | sim | |

### 1.5 Visita

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| id | string (cuid) | sim | |
| imovelId | string | sim | FK → Imovel |
| conversaId | string | sim | FK → Conversa (única) |
| dataHora | datetime | sim | Em `America/Sao_Paulo` |
| status | enum `StatusVisita` | sim | pedida, confirmada, realizada, cancelada |
| observacao | text | não | Anotação do corretor |
| criadaEm / atualizadaEm | datetime | sim | |

### 1.6 Evento

Métricas da POC.

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| id | string (cuid) | sim | |
| imovelId | string | sim | FK → Imovel |
| conversaId | string | não | Quando o evento é do chat |
| tipo | enum `TipoEvento` | sim | |
| criadoEm | datetime | sim | |

Eventos não guardam dados pessoais, IP nem user agent completo.

### 1.7 Relacionamentos

```
Corretor 1 ──── N Imovel
Imovel   1 ──── N Foto
Imovel   1 ──── N Conversa
Conversa 1 ──── 0..1 Visita
Imovel   1 ──── N Visita
Imovel   1 ──── N Evento
```

### 1.8 Enums

| Enum | Valores |
| --- | --- |
| `TipoImovel` | apartamento, casa, terreno, sala_comercial |
| `Finalidade` | venda, aluguel |
| `StatusImovel` | rascunho, publicado, vendido |
| `StatusConversa` | ativa, encerrada |
| `StatusVisita` | pedida, confirmada, realizada, cancelada |
| `TipoEvento` | visualizacao, chat_aberto, chat_mensagem, contato_capturado, visita_pedida, transferencia |

### 1.9 Ciclos de status

```
Imovel:  rascunho → publicado → vendido
                 ↖___________↙   (publicado ↔ rascunho permitido)

Visita:  pedida → confirmada → realizada
            ↘          ↘
          cancelada   cancelada
```

---

## 2. Regras de negócio

### Imóvel e página

- **RN-01** Só imóveis com status `publicado` têm página pública acessível e aparecem no sitemap.
- **RN-02** Para publicar, o imóvel precisa de: título, descrição, preço, bairro, quartos, banheiros, vagas, área e ao menos 3 fotos.
- **RN-03** O `slug` é gerado a partir de tipo, quartos, bairro e cidade (ex.: `apartamento-2-quartos-victor-konder-blumenau`). Se já existir, recebe um sufixo numérico. O slug não muda depois da primeira publicação.
- **RN-04** Imóvel `vendido` continua acessível pela URL, com aviso "Imóvel vendido", sem bolha de chat, com `noindex` e fora do sitemap.
- **RN-05** O endereço completo só aparece na página se o corretor marcar essa opção. Por padrão, a página mostra bairro e cidade, e o mapa mostra a região aproximada.
- **RN-06** Título e descrição gerados pela IA ficam como rascunho até o corretor revisar e salvar. A IA nunca publica sozinha.
- **RN-07** Um corretor só vê, edita e publica os próprios imóveis.
- **RN-08** A primeira foto (ordem 0) é a capa, usada na página e no Open Graph.

### Atendente IA

- **RN-09** O atendente responde apenas com dados do imóvel cadastrado (campos da ficha, características e informação adicional) e informações do bairro fornecidas no prompt. Nunca inventa valores, condições ou disponibilidade.
- **RN-10** Pergunta sem resposta na ficha → o atendente diz que vai confirmar com o corretor, chama `transferir_corretor` e a pergunta vai no resumo enviado ao corretor.
- **RN-11** Nome, telefone e e-mail do comprador só são gravados depois de consentimento explícito na conversa. Sem consentimento, a visita não é registrada.
- **RN-12** Para pedir visita, é obrigatório ter nome e pelo menos um contato (telefone ou e-mail).
- **RN-13** O atendente se apresenta como assistente virtual do corretor na primeira mensagem.
- **RN-14** O atendente não negocia preço, não oferece desconto e não promete aprovação de financiamento.
- **RN-15** O atendente responde em português, em mensagens curtas, com no máximo uma pergunta por mensagem.
- **RN-16** Limite de 30 mensagens do comprador por conversa. Ao atingir, o atendente oferece o contato do corretor e encerra.

### Agendamento

- **RN-17** O atendente só oferece horários que estão em `horariosVisita` do corretor e que não conflitam com visitas `pedida` ou `confirmada` do mesmo corretor.
- **RN-18** Horários oferecidos começam com antecedência mínima de 12 horas e vão até 14 dias à frente.
- **RN-19** Uma conversa gera no máximo uma visita. Para outro horário, o comprador fala com o corretor.
- **RN-20** Toda visita nasce como `pedida`. Só o corretor muda para `confirmada`, `realizada` ou `cancelada`.
- **RN-21** Ao criar uma visita, o corretor recebe e-mail com o resumo (comprador, contato, forma de pagamento, prazo, horário, perguntas pendentes) e o comprador recebe e-mail de confirmação do pedido, se tiver informado e-mail.
- **RN-22** Horários são tratados no fuso `America/Sao_Paulo`.

### Dados e privacidade

- **RN-23** Dados do comprador são visíveis apenas para o corretor dono do imóvel.
- **RN-24** O comprador pode pedir a exclusão dos seus dados; a conversa é anonimizada (perfilLead apagado, mensagens mantidas sem dados pessoais).
- **RN-25** Ao excluir um imóvel, as fotos são apagadas do Appwrite Storage.

---

## 3. Requisitos funcionais

### Corretor (painel)

| Código | Requisito |
| --- | --- |
| RF-01 | O corretor faz login por link mágico enviado ao e-mail. |
| RF-02 | O corretor edita o próprio perfil: nome, CRECI, WhatsApp, foto, horários de visita e duração da visita. |
| RF-03 | O corretor cadastra um imóvel com os campos da ficha. |
| RF-04 | O corretor envia, reordena, legenda e remove fotos do imóvel. |
| RF-05 | O corretor gera título e descrição por IA a partir da ficha e pode editá-los antes de salvar. |
| RF-06 | O corretor publica, despublica e marca o imóvel como vendido. |
| RF-07 | O corretor vê a pré-visualização da página antes de publicar. |
| RF-08 | O corretor copia o link da página para divulgar. |
| RF-09 | O corretor lista as visitas por status e data e altera o status de cada uma. |
| RF-10 | O corretor lista as conversas de cada imóvel, com o perfil do lead e as transferidas em destaque. |
| RF-11 | O corretor lê o histórico completo de uma conversa. |
| RF-12 | O corretor vê, por imóvel: visualizações, conversas abertas, contatos capturados e visitas pedidas. |

### Comprador (página pública)

| Código | Requisito |
| --- | --- |
| RF-13 | O comprador vê a página do imóvel com galeria, ficha, descrição, mapa da região, informações do bairro e dados do corretor. |
| RF-14 | O comprador abre a bolha de chat pelo botão flutuante ou pelo botão "Agendar visita". |
| RF-15 | O comprador conversa com o atendente com respostas em streaming. |
| RF-16 | O comprador usa sugestões rápidas de perguntas na abertura do chat. |
| RF-17 | O comprador retoma a conversa ao voltar à página no mesmo navegador. |
| RF-18 | O comprador dá ou nega consentimento para guardar seus dados. |
| RF-19 | O comprador escolhe um horário entre os oferecidos e recebe a confirmação do pedido na bolha e por e-mail. |
| RF-20 | O comprador acessa a política de privacidade pela página e pela bolha. |

### Atendente (sistema)

| Código | Requisito |
| --- | --- |
| RF-21 | O atendente consulta horários livres (`listar_horarios`). |
| RF-22 | O atendente registra o perfil do lead (`registrar_lead`). |
| RF-23 | O atendente registra o pedido de visita (`agendar_visita`) e dispara os e-mails. |
| RF-24 | O atendente transfere a conversa ao corretor (`transferir_corretor`) e o corretor é avisado por e-mail. |
| RF-25 | O sistema registra os eventos de métrica de cada página e conversa. |

### SEO

| Código | Requisito |
| --- | --- |
| RF-26 | Cada página publicada tem `title`, `meta description`, Open Graph e JSON-LD (`RealEstateListing`, `Offer`, `Place`). |
| RF-27 | O sistema gera `sitemap.xml`, `robots.txt` e `llms.txt` automaticamente. |

---

## 4. Requisitos não funcionais

### Desempenho

| Código | Requisito |
| --- | --- |
| RNF-01 | A página do imóvel é gerada no servidor (SSG com revalidação) e todo o conteúdo do imóvel está no HTML inicial. |
| RNF-02 | LCP abaixo de 2,5 s em 4G no celular; meta de Lighthouse ≥ 90 em desempenho e SEO. |
| RNF-03 | A bolha de chat é carregada depois da página (lazy) e não bloqueia a renderização. |
| RNF-04 | O primeiro trecho da resposta do atendente aparece em até 3 s. |
| RNF-05 | Imagens servidas com `next/image` em formato moderno e tamanho adequado à tela. |

### Segurança

| Código | Requisito |
| --- | --- |
| RNF-06 | Chaves (IA, Appwrite, SMTP, Auth) ficam só em variáveis de ambiente do servidor; nada sensível vai para o cliente. |
| RNF-07 | Toda entrada é validada com Zod: formulários, APIs e argumentos das ferramentas do atendente. |
| RNF-08 | Toda consulta do painel filtra pelo corretor da sessão. |
| RNF-09 | Upload aceita só jpg, jpeg, png e webp, até 10 MB por arquivo. |
| RNF-10 | Limite de requisições no `/api/chat`: até 20 mensagens por minuto por conversa e por IP, para conter abuso e custo. |
| RNF-11 | O prompt do atendente resiste a tentativas de mudar seu papel ("ignore as instruções") e nunca revela o prompt nem dados de outros imóveis. |

### Privacidade (LGPD)

| Código | Requisito |
| --- | --- |
| RNF-12 | Dados pessoais não aparecem em logs nem em analytics. |
| RNF-13 | Consentimento registrado com data e hora. |
| RNF-14 | Política de privacidade publicada antes do piloto. |

### Usabilidade e acessibilidade

| Código | Requisito |
| --- | --- |
| RNF-15 | Interface mobile-first; a bolha ocupa a tela inteira no celular. |
| RNF-16 | Contraste de texto WCAG AA, alvos de toque de no mínimo 44 px, navegação por teclado e fechamento da bolha com Esc. |
| RNF-17 | Toda a interface, os e-mails e o atendente em português do Brasil. |

### Operação e custo

| Código | Requisito |
| --- | --- |
| RNF-18 | A POC roda nos planos gratuitos ou de menor custo (Appwrite, banco, hospedagem, SMTP); o custo do modelo de IA é acompanhado semanalmente. |
| RNF-19 | Erros do servidor e falhas do atendente são registrados com id da conversa (sem dados pessoais) para revisão. |
| RNF-20 | Falha no envio de e-mail não perde a visita: a visita é salva primeiro e o envio é tentado de novo. |
| RNF-21 | Versões das dependências fixadas no `package.json`, em especial `@strands-agents/sdk`. |

### Qualidade

| Código | Requisito |
| --- | --- |
| RNF-22 | TypeScript em modo strict, lint sem erros e build passando antes de cada deploy. |
| RNF-23 | Casos de teste do atendente cobrindo RN-09 a RN-17 (perguntas fora da ficha, tentativa de negociação, pedido sem contato, horário indisponível), rodados antes de qualquer mudança no prompt. |