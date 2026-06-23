# --- Build Stage ---
FROM node:24-alpine3.21 AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install -g npm@latest && npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- Runner Stage ---
FROM node:24-alpine3.21 AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

COPY --chown=node:node --from=builder /app ./

EXPOSE 5000
USER node

CMD ["dumb-init", "node", "dist/index.js"]