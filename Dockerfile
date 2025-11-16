FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

# -------- Runtime --------
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "server.js"]
