# URL Shortener Architecture (Interview-Ready)

## Core Architecture Flow

### Redirect Path (latency-critical, must be fast)

`HTTP request`  
-> `Sliding-window rate limiter`  
-> `Redis cache lookup`  
-> **cache miss** -> `PostgreSQL`  
-> `301 redirect`

### Analytics Path (asynchronous, never blocks redirect)

`Click event emitted`  
-> `BullMQ job queue`  
-> `Analytics worker`  
-> `TimescaleDB`  
-> `React dashboard`

### Key Architectural Decision

The redirect path **never blocks** on analytics writes.  
Redirect performance stays predictable because click tracking is queued and processed by workers asynchronously.

This is a strong interview talking point: user-facing latency is isolated from analytics ingestion and storage load.

---

## Full Tech Stack

- **Runtime/API:** Node.js, TypeScript, Express.js
- **Primary datastore:** PostgreSQL (links + users)
- **Analytics datastore:** TimescaleDB (click time-series)
- **Caching + limits:** Redis (cache + rate limiting)
- **Async processing:** BullMQ (analytics queue + workers)
- **Short code generation:** Nanoid (collision-safe IDs)
- **Frontend/visualization:** React + Recharts (analytics dashboard)
- **Infra/dev tooling:** Docker Compose
- **Performance testing:** k6

---

## Running Locally

```bash
cp .env.example .env
npm install
docker compose up -d postgres timescaledb redis
npm run api:dev
npm run api:worker
npm run web:dev
```

The API runs on `http://localhost:4000`.
The dashboard runs on `http://localhost:5173`.

Create a short link:

```bash
curl -X POST http://localhost:4000/api/links \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://example.com"}'
```

Run the full Docker stack:

```bash
docker compose up --build
```

---

## Load Testing

After creating a link, pass its short code to k6:

```bash
RATE=5000 CODE=1 BASE_URL=http://localhost:4000 k6 run load-tests/redirect.js
```

The redirect endpoint is designed to stay fast because the hot path only performs rate limiting, cache lookup/DB fallback, analytics enqueueing, and `301` response generation. Analytics persistence happens in the worker.

---

## Engineering Challenges and Solutions

### 1) Atomic Code Generation

Use `Redis INCR` + base62 encoding to generate short codes atomically.  
Avoid random code generation under concurrent load to prevent collision/retry overhead.

### 2) Sliding-Window Rate Limiter

Use Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCOUNT`) for a real sliding window, not a naive fixed counter.  
This handles burst traffic correctly at thousands of requests per second.

### 3) Cache Invalidation

Use TTL-based caching for hot URLs, write-through on link creation, and optional startup warming from DB hot keys.  
This keeps redirect latency low while reducing DB read pressure.

### 4) Time-Series Aggregations

Use TimescaleDB continuous aggregates for hourly/daily rollups.  
Dashboard queries remain fast even when raw click rows grow into the millions.

### 5) Load Testing

Benchmark the redirect endpoint with k6 to at least `5,000 req/sec` and publish results in the README.  
This demonstrates production thinking and evidence-based performance claims.
