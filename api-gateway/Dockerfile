# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api-gateway ./cmd

# Final stage - minimal image
FROM scratch

# Copy CA certificates for HTTPS calls
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary
COPY --from=builder /app/api-gateway /app/

# Set environment variables
ENV API_ENCRYPTION_KEY=changeme
ENV JWT_SECRET=changeme

EXPOSE 8080

ENTRYPOINT ["/app/api-gateway"]
