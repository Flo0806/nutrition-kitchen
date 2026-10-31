FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@11.24.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-bookworm-slim

WORKDIR /app

# Nitro's output carries its own traced node_modules.
COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Database and pictures live in a volume; a fresh named volume takes over this directory's owner.
RUN mkdir -p .data && chown node:node .data

USER node

CMD ["node", ".output/server/index.mjs"]
