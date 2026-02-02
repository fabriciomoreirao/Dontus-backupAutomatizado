FROM node:22-alpine

WORKDIR /app

# Copia arquivos de dependências para melhor uso do cache
COPY package*.json ./


# Instala dependências
RUN npm ci

# Copia o restante dos arquivos da aplicação
COPY . .


# Compila o projeto TypeScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]