FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN npm install --include=dev && npm run build

ENV NODE_ENV=production
ENV MACHINE_CONNECT_PORT=4100

EXPOSE 4100

CMD ["node", "dist/main.js"]
