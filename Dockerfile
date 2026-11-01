FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Toolchain for the native better-sqlite3 module.
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@11.24.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim

WORKDIR /app

# Nitro's output carries its own traced node_modules, better-sqlite3 built for this same base image.
COPY --from=builder /app/.output ./.output
# Read at start: the server migrates the database before it answers.
COPY --from=builder /app/server/db/migrations ./server/db/migrations

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Database and pictures live in a volume; a fresh named volume takes over this directory's owner.
RUN mkdir -p .data && chown node:node .data

USER node

CMD ["node", ".output/server/index.mjs"]
