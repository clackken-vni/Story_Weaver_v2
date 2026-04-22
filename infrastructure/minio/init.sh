#!/bin/bash
# MinIO bucket initialization script
# Run this after MinIO container is up

set -e

MINIO_USER="${MINIO_USER:-storyweaver}"
MINIO_PASSWORD="${MINIO_PASSWORD:-storyweaver_secret}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-localhost:9000}"

echo "Waiting for MinIO to be ready..."
sleep 5

# Install mc if not present
if ! command -v mc &> /dev/null; then
    echo "Installing mc (MinIO Client)..."
    apk add --no-cache wget
    wget -O /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc
    chmod +x /usr/local/bin/mc
fi

# Set alias
mc alias set local http://${MINIO_ENDPOINT} ${MINIO_USER} ${MINIO_PASSWORD}

# Create buckets
echo "Creating storyweaver-audio bucket..."
mc mb local/storyweaver-audio --ignore-existing

echo "Creating storyweaver-assets bucket..."
mc mb local/storyweaver-assets --ignore-existing

# Set bucket policies
echo "Setting bucket policies..."
mc anonymous set download local/storyweaver-audio
mc anonymous set download local/storyweaver-assets

echo "MinIO initialization complete!"
echo "Console available at: http://${MINIO_ENDPOINT}/console"
