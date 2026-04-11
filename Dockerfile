# Stage 1: Build the frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.node.json vite.config.ts react-router.config.js ./
COPY react-router.env.d.ts postcss.config.js tailwind.config.js index.html ./
COPY app/ ./app/

RUN npm run build


# Stage 2: Install backend dependencies
FROM node:22-alpine AS backend-deps

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev


# Stage 3: Production image
FROM node:22-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy frontend build output
COPY --from=frontend-build /app/dist ./dist
COPY --from=frontend-build /app/package.json ./package.json
COPY --from=frontend-build /app/node_modules ./node_modules

# Copy backend
COPY backend/ ./backend/
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Initialize empty data files if they don't exist
RUN echo '[]' > /app/backend/users.json

RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production

EXPOSE 3000 3001

CMD ["sh", "-c", "cd /app/backend && node server.js & cd /app && npx react-router serve --port 3001 & wait"]
