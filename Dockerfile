# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Stage 2: Runtime
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN corepack enable && yarn global add serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
