CLAUDE.md

Guia para o Claude trabalhar neste repositório. Leia antes de qualquer tarefa.

Projeto

Showing (nome provisório) é uma POC: o corretor cadastra o imóvel, a plataforma gera uma página pública exclusiva e um atendente de IA conversa com o comprador numa bolha de chat dentro da página, qualifica e agenda a visita. O corretor recebe o resumo por e-mail.

Objetivo da POC: validar em 4 semanas, com 3 corretores de Blumenau, se o fluxo gera visitas agendadas.
Prioridade: o atendente IA e a bolha de chat são o que a POC testa. Em caso de dúvida de prioridade, eles vêm antes de SEO avançado, visual ou painel.
Não é produção: prefira a solução mais simples que funcione. Não adicione abstrações, filas, microserviços ou multiempresa.

Documentação de produto: README.md.

Stack
Next.js (App Router) + TypeScript (strict)
Tailwind CSS + shadcn/ui (componentes em src/components/ui). Antes de criar um componente de interface, veja se o shadcn já tem; adicione com pnpm dlx shadcn@latest add <nome>. Não reescreva os arquivos de ui/ à mão: customize por variantes ou crie um componente que os use
PostgreSQL + Prisma
Auth.js (link mágico por e-mail) — só para o corretor; o comprador não faz login
Strands Agents TypeScript SDK (@strands-agents/sdk) para o atendente: agente, tools com Zod e streaming via agent.stream(). Um agente novo por requisição, com o histórico carregado do banco; nada de agente em memória global
Appwrite Storage para fotos, acessado só no servidor com node-appwrite (a chave de API nunca vai para o cliente). O banco guarda o fileId, não a URL; a URL é montada em src/lib/storage.ts
Nodemailer + Gmail (senha de app) para e-mails (templates com React Email, renderizados com render()); configuração só via variáveis EMAIL_USER, EMAIL_APP_PASSWORD e EMAIL_FROM_NAME
pnpm
Comandos
bash
pnpm dev                 # desenvolvimento
pnpm build               # build de produção (rode antes de dizer que terminou)
pnpm lint                # lint
pnpm typecheck           # tsc --noEmit
pnpm prisma migrate dev  # nova migration após mudar o schema
pnpm prisma db seed      # dados de exemplo
pnpm test                # testes

Depois de qualquer mudança, rode pnpm typecheck e pnpm lint. Se mudar o schema.prisma, crie a migration.

Estrutura
src/app/(public)/imovel/[slug]/   página pública do imóvel (Server Component)
src/app/(painel)/painel/          painel do corretor (exige login)
src/app/api/chat/route.ts         atendente IA (streaming + tools)
src/app/api/upload/route.ts       recebe a foto do painel e envia ao Appwrite Storage
src/lib/storage.ts                cliente Appwrite, upload e URL das fotos
src/components/chat-bubble/       bolha de chat (Client Component, carregada com lazy)
src/lib/ai/prompt.ts              prompt do atendente
src/lib/ai/tools.ts               ferramentas do atendente
src/lib/ai/descricao.ts           geração de título e descrição do imóvel
src/lib/seo.ts                    metadata e JSON-LD
src/lib/db.ts                     cliente Prisma
src/lib/email.ts                  envio de e-mails
prisma/schema.prisma              modelo de dados
Convenções
Idioma: código (variáveis, funções, arquivos) em inglês ou português, mas seguindo o que já existe no arquivo; nomes de domínio ficam em português (imovel, corretor, visita). Textos de interface, prompts e mensagens ao usuário sempre em português do Brasil.
Server Components por padrão. Use "use client" só onde há interatividade (bolha de chat, formulários do painel).
Acesso ao banco só no servidor (Server Components, Server Actions, Route Handlers). Nunca exponha o Prisma ao cliente.
Valide toda entrada com Zod (formulários, body das APIs, argumentos das tools da IA).
Server Actions para mutações do painel; Route Handlers para o chat e o upload.
Componentes pequenos e sem lógica de negócio; regras ficam em src/lib.
Sem dependências novas sem motivo claro. Se adicionar uma, explique por quê.
Commits em português, no imperativo e curtos: adiciona ferramenta agendar_visita.
Atendente IA — regras que não podem quebrar

Estas regras protegem o corretor e o comprador. Qualquer mudança no prompt ou nas tools deve mantê-las:

Responde somente com dados da ficha do imóvel e do bairro passados no prompt. Nunca inventa preço, condomínio, metragem, disponibilidade ou condição.
O que não está na ficha: "vou confirmar com o corretor" + chamada de transferir_corretor.
Não negocia preço e não promete aprovação de financiamento.
Se apresenta como assistente virtual do corretor na primeira mensagem.
Pede consentimento antes de chamar registrar_lead com nome e contato.
Só agenda em horários retornados por listar_horarios. Nunca inventa horário.
Mensagens curtas, português informal, no máximo uma pergunta por vez.

A ficha do imóvel cabe no prompt: não adicione RAG, embeddings ou banco vetorial na POC.

Ferramentas atuais (src/lib/ai/tools.ts): listar_horarios, registrar_lead, agendar_visita, transferir_corretor. Toda tool valida os argumentos com Zod e confere se o imovel_id existe e está publicado.

Bolha de chat
Carregada com next/dynamic depois da página, para não afetar desempenho nem SEO.
No celular ocupa a tela inteira; no desktop é um painel no canto inferior direito.
O id da conversa fica no localStorage, sempre dentro de try/catch.
Acessível: botão real com aria-label, foco gerenciado ao abrir e fechar, fecha com Esc.
SEO
Página do imóvel é gerada no servidor (SSG + revalidação). Nada de conteúdo do imóvel renderizado só no cliente.
Use generateMetadata e os helpers de src/lib/seo.ts para title, descrição, Open Graph e JSON-LD (RealEstateListing, Offer, Place).
Imóvel com status = vendido recebe noindex e sai do sitemap.
Imagens sempre com next/image e alt descritivo.
Dados e LGPD
Dados do comprador (nome, telefone, e-mail) só aparecem para o corretor dono do imóvel. Toda consulta no painel filtra por corretor_id da sessão.
Nunca registre dados pessoais em logs nem envie para analytics.
Nunca faça commit de .env ou chaves. Novas variáveis vão para .env.example sem valor.
O que não fazer
Não integrar WhatsApp, Google Agenda, cobrança ou multiempresa: estão fora da POC.
Não trocar a stack (ORM, auth, framework) sem pedir.
Não apagar migrations existentes; crie uma nova.
Não desligar regras do TypeScript ou do lint para fazer o build passar.
Não alterar o prompt do atendente sem rodar os casos de teste do atendente (pnpm test ai).