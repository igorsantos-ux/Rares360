FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expõe a porta do Vite
EXPOSE 3000

# Rodar o Vite aceitando conexões externas
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
