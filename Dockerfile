FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock ./

RUN bun i --frozen-lockfile

COPY . .

EXPOSE 3322

CMD ["bun", "run", "./src/processManager.ts"]
