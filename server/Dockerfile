# Build
FROM node:24-alpine AS builder
WORKDIR /workspace/server
COPY server/package*.json ./
RUN npm ci
COPY server ./
COPY public ../public
RUN npm run build

# Production
FROM node:24-alpine
WORKDIR /workspace/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /workspace/server/dist ./dist
EXPOSE 9000
CMD ["node", "dist/index.js"]