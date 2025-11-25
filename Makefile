# zkSync Portal Docker Management Makefile

.PHONY: help dev prod bsc up down restart logs build status clean

# Default target
help:
	@echo "zkSync Portal Docker Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make prod         - Start production environment"
	@echo "  make bsc          - Start BSC hyperchain environment"
	@echo "  make down-dev     - Stop development environment"
	@echo "  make down-prod    - Stop production environment"
	@echo "  make down-bsc     - Stop BSC hyperchain environment"
	@echo "  make logs-dev     - Show development logs"
	@echo "  make logs-prod    - Show production logs"
	@echo "  make logs-bsc     - Show BSC hyperchain logs"
	@echo "  make build-dev    - Build development images"
	@echo "  make build-prod   - Build production images"
	@echo "  make build-bsc    - Build BSC hyperchain images"
	@echo "  make status       - Show all services status"
	@echo "  make clean        - Clean up all containers and images"

# Development environment
dev:
	@./scripts/docker-deploy.sh dev up

down-dev:
	@./scripts/docker-deploy.sh dev down

logs-dev:
	@./scripts/docker-deploy.sh dev logs

build-dev:
	@./scripts/docker-deploy.sh dev build

restart-dev:
	@./scripts/docker-deploy.sh dev restart

# Production environment
prod:
	@./scripts/docker-deploy.sh prod up

down-prod:
	@./scripts/docker-deploy.sh prod down

logs-prod:
	@./scripts/docker-deploy.sh prod logs

build-prod:
	@./scripts/docker-deploy.sh prod build

restart-prod:
	@./scripts/docker-deploy.sh prod restart

# BSC Hyperchain environment
bsc:
	@./scripts/docker-deploy.sh bsc up

down-bsc:
	@./scripts/docker-deploy.sh bsc down

logs-bsc:
	@./scripts/docker-deploy.sh bsc logs

build-bsc:
	@./scripts/docker-deploy.sh bsc build

restart-bsc:
	@./scripts/docker-deploy.sh bsc restart

# Utility commands
status:
	@echo "=== Development Environment ==="
	@docker-compose -f docker-compose.yml ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "=== Production Environment ==="
	@docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "=== BSC Hyperchain Environment ==="
	@docker-compose -f docker-compose.bsc.yml ps 2>/dev/null || echo "Not running"

clean:
	@echo "Stopping all services..."
	@docker-compose -f docker-compose.yml down 2>/dev/null || true
	@docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
	@docker-compose -f docker-compose.bsc.yml down 2>/dev/null || true
	@echo "Removing unused containers and images..."
	@docker system prune -f
	@echo "Cleanup completed!"

# Deployment commands
build-export:
	@./scripts/build-and-export.sh

build-export-tag:
	@read -p "Enter image tag: " tag; \
	./scripts/build-and-export.sh -t $$tag

server-deploy:
	@read -p "Enter Docker image file path: " file; \
	./scripts/server-deploy.sh -f $$file

# Quick aliases
up: dev
down: down-dev
logs: logs-dev
build: build-dev