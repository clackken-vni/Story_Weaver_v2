# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./

# Copy source code
COPY . .

# Download dependencies and tidy
RUN go mod tidy && go mod download

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/auth-service ./cmd

# Final stage - minimal image
FROM alpine:3.19

RUN apk add --no-cache wget ca-certificates

# Copy the binary
COPY --from=builder /app/auth-service /app/

# Set environment variables
ENV DATABASE_URL=postgres://sw_user:sw_secret@postgres:5432/storyweaver
ENV JWT_SECRET=changeme

EXPOSE 8081

ENTRYPOINT ["/app/auth-service"]
