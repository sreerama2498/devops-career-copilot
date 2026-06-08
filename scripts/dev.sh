#!/usr/bin/env bash
set -euo pipefail
DOCKER_DIR="docker"
BACKEND_DIR="backend"
cmd=${1:-help}
case "$cmd" in
  up)
    cp -n "$DOCKER_DIR/.env.example" "$DOCKER_DIR/.env" 2>/dev/null || true
    docker compose -f "$DOCKER_DIR/docker-compose.yml" --env-file "$DOCKER_DIR/.env" up -d
    echo "✓ Up!  API→ http://localhost:8000/api/docs  n8n→ http://localhost:5678"
    ;;
  down) docker compose -f "$DOCKER_DIR/docker-compose.yml" down ;;
  logs) docker compose -f "$DOCKER_DIR/docker-compose.yml" logs -f "${2:-backend}" ;;
  migrate) cd "$BACKEND_DIR" && alembic upgrade head ;;
  migrate-create) cd "$BACKEND_DIR" && alembic revision --autogenerate -m "${2:-auto}" ;;
  seed) cd "$BACKEND_DIR" && python -m scripts.seed ;;
  shell) docker compose -f "$DOCKER_DIR/docker-compose.yml" exec postgres psql -U copilot -d devops_copilot ;;
  test) cd "$BACKEND_DIR" && python -m pytest tests/ -v ;;
  *) echo "Commands: up | down | logs | migrate | migrate-create | seed | shell | test" ;;
esac
