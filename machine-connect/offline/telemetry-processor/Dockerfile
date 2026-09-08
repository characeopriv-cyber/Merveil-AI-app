FROM node:22-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY offline_telemetry_processor.js ./

USER node
CMD ["node", "offline_telemetry_processor.js"]
