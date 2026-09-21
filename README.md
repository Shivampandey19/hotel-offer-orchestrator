# Hotel Offer Orchestrator

A complete implementation of the Backend + Redis assessment.

## Stack

- Node.js 22
- TypeScript
- Express
- Temporal
- Redis
- Docker / Docker Compose
- Postman
- GitHub Actions CI
- Railway-ready deployment configuration

## Railway deployment

Railway maps each Compose service to a separate Railway service.

### API service

Connect GitHub repository:

Shivampandey19/hotel-offer-orchestrator

Use the root Dockerfile.

Start command:

node dist/server.js

Generate a public domain for the API.

### Worker service

Create a second Railway service from the same GitHub repository.

Set the Dockerfile path to:

Dockerfile.worker

The worker command is already defined as:

node dist/worker.js

Do not generate a public domain for the worker.

### Redis

Add Railway managed Redis.

Set REDIS_URL for both API and worker from the Redis service.

### Temporal

Add a Temporal server service suitable for the assessment environment.

Set:

TEMPORAL_ADDRESS=<temporal-service-private-host>:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=hotel-offers

### Service variables

API:

PORT=3000
REDIS_URL=<Railway Redis URL>
TEMPORAL_ADDRESS=<Temporal private host>:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=hotel-offers
SUPPLIER_BASE_URL=http://<api-service-private-host>:3000

Worker:

REDIS_URL=<Railway Redis URL>
TEMPORAL_ADDRESS=<Temporal private host>:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=hotel-offers
SUPPLIER_BASE_URL=http://<api-service-private-host>:3000

Use Railway private networking for service-to-service communication.

## API

GET /api/hotels?city=delhi
GET /api/hotels?city=delhi&minPrice=4000&maxPrice=6000
GET /supplierA/hotels?city=delhi
GET /supplierB/hotels?city=delhi
GET /health

## What the system does

1. Starts a Temporal workflow.
2. Calls Supplier A and Supplier B in parallel.
3. Deduplicates hotels by name.
4. Selects the lower price for overlaps.
5. Persists final offers to Redis.
6. Filters by price using Redis sorted sets.

## Expected Delhi result

- Holtin: A = 6000, B = 5340 -> B selected
- Radison: A = 5900, B = 6100 -> A selected
- Metro Inn: A = 4200, B = 4000 -> B selected
- Taj Palace: only A -> retained
- The Oberoi: only B -> retained

## Local development

npm install
npm run build
npm test
npm run dev

## Docker

docker compose up --build

## Submission checklist

- [x] TypeScript
- [x] Express
- [x] Temporal workflow
- [x] Parallel supplier calls
- [x] Deduplication
- [x] Redis persistence and filtering
- [x] Docker / Docker Compose
- [x] Railway API Dockerfile
- [x] Railway worker Dockerfile
- [x] Railway deployment configuration
- [x] Postman collection
- [x] Health check
- [x] Logging and retries
- [x] Unit tests
- [x] GitHub Actions CI
