# Showing — Página do imóvel com atendente IA (POC)

> Nome provisório.

O corretor envia as fotos do imóvel, a plataforma gera uma página exclusiva para ele e um atendente de IA conversa com o comprador numa bolha de chat dentro da própria página. O atendente tira dúvidas, qualifica o comprador e agenda a visita. **O corretor só aparece para fazer a visita.**

Esta é uma **prova de conceito (POC)**. O objetivo é validar, em 4 semanas e com 3 corretores autônomos de Blumenau, se esse fluxo transforma contatos em visitas agendadas. Não é um produto pronto para produção.

---

## Sumário

- [Hipóteses da POC](#hipóteses-da-poc)
- [Funcionalidades](#funcionalidades)
- [Fluxo](#fluxo)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Modelo de dados](#modelo-de-dados)
- [Atendente IA](#atendente-ia)
- [Bolha de chat](#bolha-de-chat)
- [SEO e GEO](#seo-e-geo)
- [Métricas e critérios de sucesso](#métricas-e-critérios-de-sucesso)
- [Fora do escopo](#fora-do-escopo)
- [Roadmap](#roadmap)
- [LGPD e privacidade](#lgpd-e-privacidade)

---

## Hipóteses da POC

1. **Adoção:** o corretor aceita cadastrar o imóvel e divulgar o link da página.
2. **Atendimento:** o comprador conversa com o atendente IA e aceita agendar visita por ele.
3. **Qualidade:** o atendente responde certo, só com dados da ficha, e passa ao corretor o que não sabe.
4. **Valor:** o corretor percebe ganho de tempo ou de visitas e diz que pagaria por isso.

## Funcionalidades

- **Painel do corretor:** login por link mágico, cadastro de imóvel (fotos, preço, endereço, ficha técnica), horários disponíveis para visita, lista de leads e visitas.
- **Descrição gerada por IA:** título e texto do anúncio gerados a partir da ficha, revisados pelo corretor antes de publicar.
- **Página pública do imóvel:** galeria, ficha, mapa, informações do bairro, SEO e dados estruturados.
- **Bolha de chat:** atendente IA dentro da página, sem abrir o WhatsApp.
- **Agendamento:** o atendente oferece os horários do corretor e registra o pedido de visita.
- **Aviso ao corretor:** e-mail com o resumo do lead (nome, contato, forma de pagamento, prazo, horário pedido).
- **Métricas básicas:** visitas na página, conversas abertas e visitas agendadas por imóvel.

## Fluxo

```
Corretor cadastra → IA gera a página → Corretor revisa e publica → Corretor divulga o link
                                                                          ↓
Corretor recebe resumo ← Visita pedida ← Atendente IA responde e qualifica ← Comprador abre a página
                                                  ↓ (dúvida fora da ficha)
                                          Corretor assume a conversa
```

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Banco de dados | PostgreSQL (Neon ou Supabase) |
| ORM | Prisma |
| Autenticação | Auth.js (link mágico por e-mail) |
| IA | Strands Agents TypeScript SDK (`@strands-agents/sdk`) + modelo com tool calling (Bedrock, Anthropic ou OpenAI) |
| Armazenamento de fotos | Appwrite Storage (Appwrite Cloud) |
| E-mail | Nodemailer + SMTP (Gmail/Google Workspace, Zoho, Amazon SES ou SMTP da hospedagem) |
| Analytics | Umami ou Plausible |
| Deploy | Vercel, Railway ou VPS com Docker |

## Arquitetura

Um único app Next.js concentra as páginas públicas, o painel e as rotas de API.

```
                    ┌──────────────────────── App Next.js ────────────────────────┐
Comprador ────────► │  Páginas do imóvel (SSG/ISR, SEO, JSON-LD) + bolha de chat │ ──► Modelo de IA
                    │  /api/chat  (atendente + ferramentas)                       │ ──► PostgreSQL
Corretor  ────────► │  Painel do corretor (cadastro, leads, visitas)              │ ──► Storage de fotos
                    └─────────────────────────────────────────────────────────────┘ ──► E-mail
```

## Estrutura de pastas

```
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  # corretor e imóvel de exemplo
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── imovel/[slug]/page.tsx    # página pública do imóvel
│   │   ├── (painel)/
│   │   │   └── painel/                   # cadastro, leads, visitas
│   │   ├── api/
│   │   │   ├── chat/route.ts             # atendente IA (streaming + tools)
│   │   │   └── upload/route.ts           # recebe a foto e envia ao Appwrite Storage
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── llms.txt/route.ts
│   ├── components/
│   │   ├── chat-bubble/                  # bolha de chat
│   │   └── imovel/                       # galeria, ficha, mapa
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── prompt.ts                 # prompt do atendente
│   │   │   ├── tools.ts                  # ferramentas do atendente
│   │   │   └── descricao.ts              # geração de título e descrição
│   │   ├── db.ts
│   │   ├── email.ts
│   │   └── seo.ts                        # metadata e JSON-LD
│   └── emails/
│       └── nova-visita.tsx
├── .env.example
└── README.md
```

## Como rodar localmente

**Pré-requisitos:** Node.js 20+, pnpm e um PostgreSQL (local via Docker ou na nuvem).

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# preencha os valores (veja a seção abaixo)

# 3. Subir um Postgres local (opcional)
docker run -d --name showing-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=showing postgres:16

# 4. Criar as tabelas e popular com dados de exemplo
pnpm prisma migrate dev
pnpm prisma db seed

# 5. Rodar
pnpm dev
```

Acesse:

- Página de exemplo: http://localhost:3000/imovel/apartamento-2-quartos-victor-konder-blumenau
- Painel do corretor: http://localhost:3000/painel

### Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Roda o build |
| `pnpm lint` | Lint |
| `pnpm prisma studio` | Interface para ver o banco |

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `AUTH_SECRET` | Segredo do Auth.js (`npx auth secret`) |
| `AI_API_KEY` | Chave do provedor do modelo de IA |
| `AI_MODEL` | Nome do modelo usado pelo atendente |
| `APPWRITE_ENDPOINT` | Endpoint do Appwrite (ex.: `https://<região>.cloud.appwrite.io/v1`) |
| `APPWRITE_PROJECT_ID` | Id do projeto no Appwrite |
| `APPWRITE_API_KEY` | Chave de API com escopo `files.read` e `files.write` (só no servidor) |
| `APPWRITE_BUCKET_ID` | Id do bucket das fotos |
| `SMTP_HOST` | Servidor SMTP (ex.: `smtp.gmail.com`) |
| `SMTP_PORT` | Porta SMTP (`465` com SSL ou `587` com STARTTLS) |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP (no Gmail, uma senha de app) |
| `EMAIL_FROM` | Remetente dos e-mails |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (usada em SEO e links) |

Nunca faça commit do arquivo `.env`.

## Modelo de dados

| Tabela | Campos principais | Observação |
| --- | --- | --- |
| `corretores` | id, nome, creci, email, whatsapp, horarios_visita (JSON) | Horários que o atendente pode oferecer |
| `imoveis` | id, corretor_id, slug, tipo, bairro, endereco, preco, condominio, iptu, quartos, vagas, area_m2, aceita_financiamento, descricao, status | `status`: rascunho, publicado, vendido |
| `fotos` | id, imovel_id, file_id, ordem, legenda | Arquivo no Appwrite Storage; a URL é montada a partir do `file_id` |
| `conversas` | id, imovel_id, mensagens (JSON), perfil_lead (JSON), consentimento, criada_em | `perfil_lead`: nome, contato, pagamento, prazo |
| `visitas` | id, imovel_id, conversa_id, data_hora, status | `status`: pedida, confirmada, realizada, cancelada |
| `eventos` | id, imovel_id, tipo, criado_em | Visualizações e cliques |

## Atendente IA

O atendente responde **somente** com dados da ficha do imóvel e do bairro. A ficha cabe inteira no prompt, então a POC não usa RAG nem banco vetorial.

**Fases da conversa:**

1. **Responder:** dúvidas sobre preço, condomínio, vagas, financiamento, metragem e localização.
2. **Qualificar:** nome, forma de pagamento (financiamento, à vista, FGTS), prazo para mudar e contato.
3. **Agendar:** oferece os horários livres do corretor e registra o pedido.

**Ferramentas (tool calling):**

| Ferramenta | O que faz |
| --- | --- |
| `listar_horarios(imovel_id)` | Retorna os próximos horários livres do corretor |
| `registrar_lead(dados)` | Salva o perfil do comprador na conversa |
| `agendar_visita(imovel_id, data_hora)` | Cria a visita como "pedida" e envia o e-mail ao corretor |
| `transferir_corretor(motivo)` | Marca a conversa para o corretor assumir |

**Regras:**

- Nunca inventa informação. O que não está na ficha recebe "vou confirmar com o corretor" e vai para o resumo.
- Não negocia preço nem promete aprovação de financiamento.
- Avisa no início que é um assistente virtual do corretor.
- Pede consentimento antes de guardar nome e contato.
- Mensagens curtas, em português informal, no máximo uma pergunta por vez.

## Bolha de chat

- Botão fixo no canto inferior direito com a foto do corretor e o texto "Dúvidas sobre este imóvel?".
- Abre um painel sobre a página. No celular ocupa a tela inteira.
- A primeira mensagem já fala do imóvel. Sugestões rápidas em botões: "Aceita financiamento?", "Qual o condomínio?", "Quero agendar uma visita".
- O botão "Agendar visita" da página abre a bolha direto no agendamento.
- Respostas em streaming, com indicador de "digitando".
- O id da conversa fica no `localStorage`: o histórico continua se o comprador voltar.
- O componente é carregado depois da página (lazy), para não prejudicar desempenho nem SEO.
- Sem WhatsApp, o contato do comprador é pedido antes de confirmar a visita.

## SEO e GEO

- Páginas geradas no servidor (SSG com revalidação).
- URL descritiva: `/imovel/apartamento-2-quartos-victor-konder-blumenau`.
- `title`, `meta description` e Open Graph gerados da ficha.
- Dados estruturados JSON-LD: `RealEstateListing`, `Offer`, `Place`.
- `sitemap.xml`, `robots.txt` e `llms.txt` automáticos.
- Imagens otimizadas com `next/image` e `alt` descritivo.
- Imóvel vendido recebe `noindex`.

Em 4 semanas um domínio novo não ranqueia. Na POC, o tráfego vem da divulgação do corretor.

## Métricas e critérios de sucesso

| Hipótese | Métrica | Meta inicial |
| --- | --- | --- |
| Adoção | Corretores que publicaram e divulgaram ao menos 2 imóveis | 3 de 3 |
| Atendimento | Visitantes que abrem a bolha de chat | 10% ou mais |
| Atendimento | Conversas que chegam a um pedido de visita | 15% ou mais |
| Qualidade | Informação inventada na revisão manual das conversas | Zero |
| Valor | Visitas agendadas pelo atendente | Ao menos 1 por corretor |
| Valor | Corretores que dizem que pagariam | 2 de 3, com valor citado |

Todas as conversas são revisadas manualmente toda semana.

## Fora do escopo

- Envio de fotos e dados pelo WhatsApp
- Continuar a conversa no WhatsApp (Evolution API)
- Integração com Google Agenda
- Páginas de bairro, blog e domínio próprio do corretor
- Relatório mensal automático
- Assinatura, cobrança e multiempresa

## Roadmap

| Semana | Entrega |
| --- | --- |
| 1 | Cadastro de imóvel, fotos, descrição por IA, página pública, SEO e deploy |
| 2 | Bolha de chat, atendente com ferramentas, e-mail ao corretor, demo com imóvel real |
| 3 | Piloto com 3 corretores e revisão semanal das conversas |
| 4 | Ajustes, conversa final com os corretores e decisão de seguir ou parar |

## LGPD e privacidade

- Consentimento explícito no chat antes de guardar dados pessoais.
- Link para a política de privacidade na bolha e na página.
- Dados do comprador visíveis apenas para o corretor do imóvel.
- Exclusão de dados mediante solicitação.