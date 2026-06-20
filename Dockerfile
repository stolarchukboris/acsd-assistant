FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun i --frozen-lockfile

COPY . .

CMD ["bun", "run", "src/index.ts"]
