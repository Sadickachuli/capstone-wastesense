#!/bin/bash

# WasteSense Deployment Script for Ghana
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying WasteSense to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    # Check if Docker is installed (optional)
    if ! command -v docker &> /dev/null; then
        log_warn "Docker is not installed. Docker deployment will not be available."
    fi
    
    log_info "Prerequisites check completed ✓"
}

# Environment setup
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Frontend environment
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warn "Created .env from .env.example. Please update with your values."
        else
            log_error ".env.example not found. Please create environment files."
            exit 1
        fi
    fi
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_warn "Created backend/.env from backend/.env.example. Please update with your values."
        else
            log_error "backend/.env.example not found. Please create backend environment file."
            exit 1
        fi
    fi
    
    log_info "Environment setup completed ✓"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build frontend
    log_info "Building frontend..."
    npm install
    npm run build
    
    # Build backend
    log_info "Building backend..."
    cd backend
    npm install
    npm run build
    cd ..
    
    # Install ML service dependencies
    log_info "Setting up ML service..."
    cd ml_service
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..
    
    # Install YOLO API dependencies
    log_info "Setting up YOLO API..."
    cd wastesense-api/wastesense-api
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Check if YOLO model exists
    if [ ! -f "best.pt" ]; then
        log_error "YOLO model file (best.pt) not found in wastesense-api/wastesense-api/"
        log_error "Please download or copy the trained YOLO model file."
        exit 1
    fi
    
    deactivate
    cd ../..
    
    log_info "Build completed ✓"
}

# Database setup
setup_database() {
    log_info "Setting up database..."
    
    cd backend
    
    # Run migrations
    log_info "Running database migrations..."
    npm run migrate
    
    # Run seeds
    log_info "Running database seeds..."
    npm run seed
    
    cd ..
    
    log_info "Database setup completed ✓"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Start backend
    log_info "Starting backend service..."
    cd backend
    pm2 start dist/index.js --name "wastesense-backend" || pm2 restart wastesense-backend
    cd ..
    
    # Start ML service
    log_info "Starting ML service..."
    cd ml_service
    source venv/bin/activate
    pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name "wastesense-ml" || pm2 restart wastesense-ml
    deactivate
    cd ..
    
    # Start YOLO API
    log_info "Starting YOLO API..."
    cd wastesense-api/wastesense-api
    source venv/bin/activate
    pm2 start "uvicorn app:app --host 0.0.0.0 --port 8001" --name "wastesense-yolo" || pm2 restart wastesense-yolo
    deactivate
    cd ../..
    
    # Save PM2 configuration
    pm2 save
    
    log_info "Services started ✓"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Backend health check passed ✓"
    else
        log_error "Backend health check failed ✗"
    fi
    
    # Check ML service
    if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
        log_info "ML service health check passed ✓"
    else
        log_error "ML service health check failed ✗"
    fi
    
    # Check YOLO API
    if curl -f http://localhost:8001/docs > /dev/null 2>&1; then
        log_info "YOLO API health check passed ✓"
    else
        log_error "YOLO API health check failed ✗"
    fi
}

# Docker deployment
deploy_docker() {
    log_info "Deploying with Docker..."
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    # Build and start containers
    docker-compose up --build -d
    
    # Wait for services
    log_info "Waiting for services to start..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations in container..."
    docker-compose exec backend npm run migrate
    docker-compose exec backend npm run seed
    
    log_info "Docker deployment completed ✓"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add any cleanup tasks here
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    log_info "Starting WasteSense deployment for Ghana 🇬🇭"
    
    # Check if Docker deployment is requested
    if [ "$2" = "docker" ]; then
        check_prerequisites
        setup_environment
        deploy_docker
        log_info "🎉 WasteSense deployed successfully with Docker!"
        log_info "Access the application at: http://localhost"
        return
    fi
    
    # Standard deployment
    check_prerequisites
    setup_environment
    build_applications
    setup_database
    start_services
    health_check
    
    log_info "🎉 WasteSense deployed successfully!"
    log_info "Frontend: http://localhost (if using Nginx)"
    log_info "Backend API: http://localhost:3001"
    log_info "ML Service: http://localhost:8000"
    log_info "YOLO API: http://localhost:8001"
    log_info ""
    log_info "To monitor services: pm2 monit"
    log_info "To view logs: pm2 logs"
    log_info "To stop services: pm2 stop all"
}

# Run main function
main "$@" 