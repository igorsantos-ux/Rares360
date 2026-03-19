# Etapa 1: Build
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Recebe a URL da API como argumento de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor de Produção (Nginx)
FROM nginx:stable-alpine

# Copia os arquivos compilados do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração customizada do Nginx para suportar React Router (Single Page App)
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
