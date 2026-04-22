# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_ENCRYPTION_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_ENCRYPTION_KEY=${NEXT_PUBLIC_API_ENCRYPTION_KEY}

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

# Copy admin.html for SPA fallback (Next.js pages router)
COPY --from=builder /app/.next/server/pages/admin.html /usr/share/nginx/html/admin.html

# Also copy as index.html for nginx fallback
COPY --from=builder /app/.next/server/pages/admin.html /usr/share/nginx/html/index.html

# Create necessary directories
RUN mkdir -p /usr/share/nginx/html/_next/static /var/cache/nginx/client

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
