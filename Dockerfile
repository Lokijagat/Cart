FROM node:20-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY . .

RUN pnpm install --prod --frozen-lockfile

RUN npm run build

CMD ["npm", "run", "docker-start"]
