# Docker Setup for USDT-JOD Exchange Platform

This document provides instructions for running the USDT-JOD Exchange Platform using Docker.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine
- Git (to clone the repository)

## Getting Started

### Environment Variables

1. Create a `.env` file in the root directory of the project. You can use the `.env.example` file as a template:

```bash
cp .env.example .env
```

2. Update the environment variables in the `.env` file as needed.

### Running the Application

To start all the services (database, backend, and frontend):

```bash
docker-compose up
```

Or to run in detached mode:

```bash
docker-compose up -d
```

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Stopping the Application

```bash
docker-compose down
```

To remove volumes as well (this will delete the database data):

```bash
docker-compose down -v
```

## Docker Services

The Docker Compose setup includes the following services:

1. **postgres**: PostgreSQL database
   - Port: 5432
   - Data is persisted in a Docker volume

2. **server**: Backend Node.js server
   - Port: 5000
   - Source code is mounted as a volume for development

3. **client**: Frontend React application
   - Port: 3000
   - Source code is mounted as a volume for development

## Development Workflow

When working on the project using Docker:

1. Make changes to the source code
2. The changes will be automatically picked up by the running containers (thanks to volume mounts)
3. The server uses `ts-node-dev` which automatically restarts when files change
4. The client uses Vite's hot module replacement to update without refreshing

## Database Migrations

To run database migrations:

```bash
docker-compose exec server npm run db:push
```

To generate new migrations:

```bash
docker-compose exec server npm run db:generate
```

## Building for Production

For production deployment, build the Docker images with:

```bash
docker-compose -f docker-compose.prod.yml build
```

And run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

> Note: You need to create a `docker-compose.prod.yml` file with production-specific configurations.

## Troubleshooting

### Container Logs

To view container logs:

```bash
docker-compose logs
```

To follow logs for a specific service:

```bash
docker-compose logs -f server
```

### Accessing the Database

To access the PostgreSQL database:

```bash
docker-compose exec postgres psql -U postgres -d usdt_jod_exchange
```

### Restarting Services

To restart a single service:

```bash
docker-compose restart server
``` 