# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Next.js static files and HTML pages
COPY --from=builder /app/.next /usr/share/nginx/html/_next
COPY --from=builder /app/.next/server/pages /usr/share/nginx/html/_next/server/pages
COPY --from=builder /app/package.json /usr/share/nginx/html/package.json

# Copy index.html for SPA fallback
COPY --from=builder /app/.next/server/pages/index.html /usr/share/nginx/html/index.html

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html/_next/static /var/cache/nginx/client

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
