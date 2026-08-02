# Build
FROM node:24-alpine AS builder
WORKDIR /scanner
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM node:24-alpine
WORKDIR /scanner
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /scanner/dist ./dist
EXPOSE 9000
CMD ["node", "dist/index.js"]