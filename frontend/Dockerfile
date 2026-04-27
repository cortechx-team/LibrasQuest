# Esperar luiz subir o frontend  pra atualizar de acordo
# Por enquanto vou subir a imagem 18-alpine
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
