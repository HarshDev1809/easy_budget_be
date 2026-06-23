# --- Build Stage ---
FROM node:24-alpine3.21 AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install -g npm@latest && npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

RUN npm prune --omit=dev

# --- Runner Stage ---
FROM node:24-alpine3.21 AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY drizzle/ ./drizzle/

EXPOSE 5000
USER node

CMD ["dumb-init", "node", "dist/index.js"]