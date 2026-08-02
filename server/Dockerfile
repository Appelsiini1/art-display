# Build
FROM node:24-alpine AS builder
WORKDIR ./server
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM node:24-alpine
WORKDIR ./server
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder ./server/dist ./dist
EXPOSE 9000
CMD ["node", "dist/index.js"]