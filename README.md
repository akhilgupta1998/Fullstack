# Fullstack Search App

A production-ready fullstack application built with Docker.

## Stack
- Backend: Node.js + Express
- Frontend: React
- Search: Elasticsearch
- Cache: Redis
- Orchestration: Docker Compose

## Features
- Cached search using Redis
- Elasticsearch-backed querying
- Debounced frontend search
- Dependency-aware health checks

## Local Development

```bash
docker compose up --build
