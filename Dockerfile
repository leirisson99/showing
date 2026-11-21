# syntax=docker/dockerfile:1
#
# Imagem do Showing (Next.js 16 + Prisma 7). Três alvos:
#   app      (padrão) servidor de produção, enxuto (saída "standalone")
#   migrate  roda `prisma migrate deploy`; usado uma vez por versão, antes de subir o app
#   builder  etapa de build (não use direto)
#
# Build:  docker build --build-arg NEXT_PUBLIC_SITE_URL=https://seu-dominio.com.br -t showing .
# Chaves e senhas NÃO entram na imagem: vão por variáveis de ambiente ao rodar (veja docker-compose.prod.yml).

ARG NODE_VERSION=24

# ---------- dependências ----------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `postinstall` roda `prisma generate`: precisa do schema e da config, sem banco.
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS builder
# O domínio público entra no build: vira canônica, sitemap, Open Graph e e-mails.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_EMAIL_PRIVACIDADE
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_EMAIL_PRIVACIDADE=${NEXT_PUBLIC_EMAIL_PRIVACIDADE} \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN mkdir -p public
# Sem banco no build: o generateStaticParams cai no modo "sob demanda". O endpoint do Appwrite
# precisa estar no build para o next/image liberar o host das fotos.
ARG APPWRITE_ENDPOINT
ENV APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT}
RUN pnpm build

# ---------- migrações ----------
FROM builder AS migrate
ENV NODE_ENV=production
CMD ["pnpm", "prisma", "migrate", "deploy"]

# ---------- servidor ----------
FROM node:${NODE_VERSION}-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
