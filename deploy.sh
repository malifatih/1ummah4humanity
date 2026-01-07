#!/bin/bash

echo "🚀 Deploying 1ummah.me to Production..."

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed." >&2
  echo "Please install Docker first: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

# Build and Start Containers
echo "Building and starting containers..."
docker-compose up -d --build

echo "✅ Deployment successful!"
echo "Your app is running at http://localhost:3000"
