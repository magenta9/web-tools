#!/bin/bash

# Web Tools Setup Script
# This script checks and installs all necessary dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is running
docker_running() {
    docker info >/dev/null 2>&1
}

print_status "🚀 Web Tools Setup Script"
echo "=================================="

# Check and install Node.js
print_status "Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed!"
    print_status "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check and install Bun
print_status "Checking Bun..."
if command_exists bun; then
    BUN_VERSION=$(bun --version)
    print_success "Bun is installed: v$BUN_VERSION"
else
    print_warning "Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    if command_exists bun; then
        print_success "Bun installed successfully!"
    else
        print_error "Failed to install Bun. Please install manually from https://bun.sh/"
        exit 1
    fi
fi

# Check Docker
print_status "Checking Docker..."
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
    
    if docker_running; then
        print_success "Docker is running"
    else
        print_warning "Docker is installed but not running. Please start Docker Desktop."
    fi
else
    print_warning "Docker is not installed. Backend services will not be available."
    print_status "To install Docker, visit: https://docs.docker.com/get-docker/"
fi

# Check Docker Compose
print_status "Checking Docker Compose..."
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version)
    else
        COMPOSE_VERSION=$(docker compose version)
    fi
    print_success "Docker Compose is available: $COMPOSE_VERSION"
else
    print_warning "Docker Compose is not available. Backend deployment may not work."
fi

# Check Go (optional for development)
print_status "Checking Go..."
if command_exists go; then
    GO_VERSION=$(go version)
    print_success "Go is installed: $GO_VERSION"
else
    print_warning "Go is not installed. Only needed for backend development."
    print_status "To install Go, visit: https://golang.org/dl/"
fi

# Check Make
print_status "Checking Make..."
if command_exists make; then
    print_success "Make is available"
else
    print_warning "Make is not installed. Backend commands may not work."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Install with: xcode-select --install"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Install with: sudo apt-get install build-essential (Ubuntu/Debian)"
    fi
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if [ -f "package.json" ]; then
    bun install
    print_success "Frontend dependencies installed!"
else
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

# Summary
echo ""
echo "=================================="
print_status "📋 Setup Summary"
echo "=================================="

if command_exists node && command_exists bun; then
    print_success "✅ Frontend ready - run: bun dev"
else
    print_error "❌ Frontend not ready - missing dependencies"
fi

if command_exists docker && docker_running; then
    print_success "✅ Backend ready - run: cd server-go && make up"
else
    print_warning "⚠️  Backend not ready - Docker not available"
fi

echo ""
print_status "🎉 Setup complete! Check the summary above for next steps."
print_status "📖 See README.md for detailed usage instructions."
