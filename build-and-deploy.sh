#!/bin/bash

# Docker Build and Deploy Script for Rispo Application
# This script ensures the application can be built on any machine with only Docker installed

set -e  # Exit on error

echo "================================================"
echo "  Rispo Docker Build & Deploy Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker."
    exit 1
fi
print_success "Docker daemon is running"

# Clean up old containers and images (optional)
read -p "Do you want to clean up old containers and images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Stopping and removing old containers..."
    docker-compose down -v 2>/dev/null || true
    
    print_info "Removing old images..."
    docker rmi rispo-app 2>/dev/null || true
    
    print_success "Cleanup complete"
fi

# Build the application
print_info "Building Docker images (this may take several minutes)..."
docker-compose build --no-cache app

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Start the services
print_info "Starting services..."
docker-compose up -d

if [ $? -eq 0 ]; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Wait for application to be healthy
print_info "Waiting for application to be ready..."
sleep 10

# Check if application is running
if docker ps | grep -q "rispo-app"; then
    print_success "Application is running"
    echo ""
    echo "================================================"
    echo "  Application URLs:"
    echo "================================================"
    echo "  Frontend:     http://localhost:3000"
    echo "  Backend API:  http://localhost:8080"
    echo "  Grafana:      http://localhost:3000 (admin/admin)"
    echo "  Prometheus:   http://localhost:9090"
    echo "  RabbitMQ:     http://localhost:15672 (rispo_admin/R!#po123##)"
    echo "================================================"
    echo ""
    print_info "To view logs: docker-compose logs -f app"
    print_info "To stop: docker-compose down"
else
    print_error "Application failed to start"
    print_info "Check logs with: docker-compose logs app"
    exit 1
fi
