# Etapa 1: Build
FROM node:20.18-slim AS build

WORKDIR /app

COPY package*.json ./
# Usando npm ci no React é mais seguro, mas a base usava legacy-peer-deps.
RUN npm install --legacy-peer-deps

COPY . .

# Recebe a URL da API como argumento de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor de Produção (Nginx Seguro)
FROM nginx:stable-alpine

# Limpar default html
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos compilados do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração segura do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Adicionar permissões corretas para rodar Nginx como non-root (alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Trocar para usuário não privilegiado
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
