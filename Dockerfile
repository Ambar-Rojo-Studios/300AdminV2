FROM node:22-slim AS builder
WORKDIR /front
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /front
COPY --from=builder /front/dist/lugares-front ./dist/lugares-front
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/lugares-front/server/server.mjs"]
