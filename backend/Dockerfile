# Stage 1: Builder
FROM node:20.18-slim AS builder

# Instalar OpenSSL para o Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências (inclusive devDependencies para build)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copiar código-fonte e Prisma schema
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime (Production)
FROM node:20.18-slim AS runner

# Instalar PM2 globalmente e OpenSSL para o Prisma no runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pm2

WORKDIR /app

# Configurar ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Criar grupo e usuário não-root (Boas práticas de segurança)
RUN groupadd -r nodejs && useradd -m -r -g nodejs nodeuser

# Copiar arquivos necessários do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/ecosystem.config.cjs ./

# Instalar apenas dependências de produção para reduzir imagem
RUN npm ci --omit=dev

# Ajustar permissões para o novo usuário
RUN chown -R nodeuser:nodejs /app

# Mudar para usuário não-root
USER nodeuser

EXPOSE 3001

# Comando default via PM2 ou tsx
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
