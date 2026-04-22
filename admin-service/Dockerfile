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
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/admin-service ./cmd

# Final stage - minimal image
FROM alpine:3.19

RUN apk add --no-cache wget ca-certificates

# Copy the binary
COPY --from=builder /app/admin-service /app/

# Set environment variables
ENV DATABASE_URL=postgres://sw_user:sw_secret@postgres:5432/storyweaver

EXPOSE 8085

ENTRYPOINT ["/app/admin-service"]
