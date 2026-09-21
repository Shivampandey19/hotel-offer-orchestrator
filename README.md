# Hotel Offer Orchestrator

A complete implementation of the **Backend + Redis** assessment.

## Stack

- Node.js 22
- TypeScript
- Express
- Temporal
- Redis
- Docker / Docker Compose
- Postman
- GitHub Actions CI

## What the system does

GET /api/hotels?city=delhi

1. Starts a Temporal workflow.
2. Temporal runs Supplier A and Supplier B activities in parallel.
3. Each supplier returns mock hotel data.
4. The workflow deduplicates hotels by name.
5. If a hotel exists in both suppliers, the cheaper price wins.
6. Hotels present in only one supplier are retained.
7. The final list is persisted in Redis.
8. The API reads the result from Redis.
9. Optional minPrice / maxPrice filtering is performed directly by Redis using a sorted set.

## API

GET /api/hotels?city=delhi

GET /api/hotels?city=delhi&minPrice=4000&maxPrice=6000

GET /supplierA/hotels?city=delhi
GET /supplierB/hotels?city=delhi

GET /health

The health endpoint checks Redis, Temporal, Supplier A and Supplier B.

## Expected Delhi result

The mock data intentionally contains overlaps:

- Holtin: A = 6000, B = 5340 -> B selected
- Radison: A = 5900, B = 6100 -> A selected
- Metro Inn: A = 4200, B = 4000 -> B selected
- Taj Palace: only A -> retained
- The Oberoi: only B -> retained

The API returns the selected offers ordered by price.

## Redis design

Two structures are used per city:

hotels:price:<city>

Redis Sorted Set where the score is the hotel price.

hotel:<city>:<hotel-name>

Redis String containing the final response JSON.

Price filtering is executed in Redis with ZRANGEBYSCORE, avoiding fetching the complete list into Node.js just to filter it.

## Temporal design

The workflow is deterministic and delegates external I/O to activities:

hotelOfferWorkflow
  -> fetchSupplierA()
  -> fetchSupplierB()
  -> deduplicateOffers
  -> persistOffers
  -> Redis

Supplier activities have retry configuration for transient failures.

## Run with Docker

Prerequisites: Docker Desktop / Docker Engine.

docker compose up --build

Services:

| Service | Address |
|---|---|
| API | http://localhost:3000 |
| Redis | localhost:6379 |
| Temporal gRPC | localhost:7233 |
| Temporal UI | http://localhost:8233 |

## Test

curl "http://localhost:3000/api/hotels?city=delhi"
curl "http://localhost:3000/api/hotels?city=delhi&minPrice=4000&maxPrice=6000"
curl "http://localhost:3000/api/hotels?city=mumbai"
curl "http://localhost:3000/health"

## Local development

Run Redis and Temporal locally, then:

npm install
npm run build
npm test
npm run dev

Environment variables are documented in .env.example.

## Postman

Import postman/Hotel-Offer-Orchestrator.postman_collection.json.

The collection covers valid Delhi request with overlapping hotels, price filtering, city with no results, Supplier A, Supplier B, and health check.

## Supplier-down scenario

The assessment marks supplier-down simulation as optional. The architecture isolates supplier calls into Temporal activities with retries and error logging. For a production extension, a mock failure flag can be added to the supplier routes without changing the workflow contract.

## Production considerations

For production, consider Redis connection retry/backoff and circuit breaker, Temporal task queue monitoring, correlation IDs, Prometheus metrics, distributed tracing, authentication/rate limiting, persistent Temporal database, supplier timeout/fallback policy, schema validation with Zod, contract/integration tests, and Kubernetes deployment.

## Submission checklist

- [x] Source code
- [x] TypeScript
- [x] Express
- [x] Temporal workflow
- [x] Parallel supplier calls
- [x] Overlap comparison
- [x] Deduplication
- [x] Redis persistence
- [x] Redis price filtering
- [x] Dockerfile
- [x] Docker Compose
- [x] README
- [x] Postman collection
- [x] Health check bonus
- [x] Logging
- [x] Activity retries
- [x] Unit tests
- [x] GitHub Actions CI
