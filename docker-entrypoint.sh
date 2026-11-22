#!/bin/sh
# Ao subir o contêiner: aplica as migrations, cria o corretor (seed) e inicia o servidor.
# As ferramentas (prisma, tsx) ficam em /tool, fora do servidor enxuto.
set -e

if [ -n "$DATABASE_URL" ] && [ "${RODAR_MIGRATIONS:-1}" = "1" ]; then
  echo "Aplicando migrations..."
  (cd /tool && ./node_modules/.bin/prisma migrate deploy)
fi

# Seed só com SEED_CORRETOR_EMAIL definido (sem ele criaria o e-mail de exemplo). Em produção cria
# apenas o corretor, sem imóvel de exemplo; é idempotente (upsert), então pode rodar a cada subida.
if [ -n "$DATABASE_URL" ] && [ -n "$SEED_CORRETOR_EMAIL" ] && [ "${RODAR_SEED:-1}" = "1" ]; then
  echo "Rodando o seed do corretor..."
  (cd /tool && SEED_SO_CORRETOR="${SEED_SO_CORRETOR:-1}" ./node_modules/.bin/tsx prisma/seed.ts)
fi

exec node server.js
