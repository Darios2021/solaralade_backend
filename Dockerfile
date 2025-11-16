FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# 👇 OJO: ahora apuntamos a src/server.js
CMD ["node", "src/server.js"]
