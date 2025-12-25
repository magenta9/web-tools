.PHONY: db-up db-down db-reset db-logs run build clean up down logs

# Docker commands (all services)
up:
	docker compose -f docker/docker-compose.yml up -d --build

down:
	docker compose -f docker/docker-compose.yml down

logs:
	docker compose -f docker/docker-compose.yml logs -f

# Database only commands
db-up:
	docker compose -f docker/docker-compose.yml up -d postgres

db-down:
	docker compose -f docker/docker-compose.yml down

db-reset:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.yml up -d postgres

db-logs:
	docker compose -f docker/docker-compose.yml logs -f postgres

# Go commands
run:
	go run cmd/server/main.go

build:
	go build -o bin/server cmd/server/main.go

clean:
	rm -rf bin/
