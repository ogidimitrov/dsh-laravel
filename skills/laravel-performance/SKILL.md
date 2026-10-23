---
name: laravel-performance
description: Find and fix the Laravel performance problems that actually matter, in order of measured impact.
---

# Performance and scale

Most Laravel performance work produces no measurable change, because it is aimed at the wrong
thing. The impact ranking below is stable and worth internalising:

| Rank | Cause | Typical effect |
| --- | --- | --- |
| **1** | **N+1 queries** | Dominant. One query per row turns a 20 ms page into 2 s |
| **2** | **Missing indexes** | Table scans that grow linearly with data |
| **3** | **Unbounded result sets** | Memory exhaustion; the page that worked in dev dies in production |
| **4** | **Work in the request that belongs in a queue** | Latency multiplied by every user |
| **5** | **Caching** | Real, but listed last on purpose |

Two rules follow:

- **Measure before optimizing.** A baseline first, then one change, then re-measure. "This should be
  faster" is not a result.
- **Never use caching to hide ranks 1–4.** Caching an N+1 does not fix it; it delays it and makes it
  invisible until the cache goes cold.

## Detect — do not guess

| Tool | Use |
| --- | --- |
| `Model::preventLazyLoading()` (dev/test only) | Turns every lazy-loaded relation into an exception. The single highest-value guard |
| Laravel Pulse (`laravel/pulse`, 1.8.1) | Slow queries, slow jobs, exceptions, queue health — self-hosted, production-safe |
| Laravel Telescope (`laravel/telescope`, 5.25.0) | Development introspection: queries per request, duplicates, timing |
| Laravel Nightwatch (`laravel/nightwatch`, 1.30.2) | First-party production APM: traces, slow requests, query attribution |
| Laravel Pail (`laravel/pail`) | Tail logs live while reproducing |
| The database's own logging | Slow query log (MySQL), `log_min_duration_statement` (PostgreSQL) — the ground truth |
| `EXPLAIN` / `EXPLAIN ANALYZE` | Confirms whether an index is used, before and after |
| `php artisan about` | Confirms drivers actually in use — a surprising number of "performance" bugs are a wrong driver |

Reproduce the slow path against **production-shaped data volume**. A query that is instant on 200
rows tells you nothing about 2 million.

## Queries

- **Eager load** with `with()` / `load()` / `withCount()`. A relation touched in a loop, a Blade
  loop, an API Resource, or a Livewire/Filament table column is an N+1 until proven otherwise.
- **Aggregate in SQL, not PHP.** `withCount()`, `withSum()`, `exists()`, `DB::select` aggregates —
  instead of loading rows and counting them in a collection.
- **Select only what you need** on wide tables; `SELECT *` pulls blobs you never read.
- **Use `exists()` rather than `count() > 0`**; `count(*)` scans more than a semi-join.
- **Batch instead of looping queries**: `whereIn` over N ids beats N `find()` calls.
- **`whenLoaded()` in API Resources** so a relation is serialized only when it was eager-loaded —
  it makes N+1 visible in the response shape instead of silently firing queries.
- **Add indexes for what you filter, join, and sort on.** Composite index column order matters; a
  leading-wildcard `LIKE '%term'` cannot use a standard index.
- **Index in the same migration** that introduces the query pattern — not in a later "performance
  pass" that never happens.
- For write-heavy paths, prefer bulk `upsert()` / query-builder `update()` over per-row model saves,
  which fire events and hydration for every row.

## Memory and unbounded work

- **Paginate.** `paginate()` on any collection the user can grow. `get()` on an unbounded table is a
  production outage waiting for enough data.
- **`chunkById()`** for backfills and bulk processing — never `chunk()` on a mutating table.
- **`lazy()` / `cursor()`** for exports and streaming; they hold one row, not the set.
- **Avoid loading full Eloquent models** for bulk operations that need only one column.
- Remember Livewire serializes public properties to the client — a large collection in a public
  property is both a payload and a memory problem.

## Queues as a performance tool

The largest structural win available: **move anything slow or remote off the request path.**

- Email, PDF/report generation, third-party calls, image processing, webhooks → queue them.
- Set `$tries`, `$backoff`, `$timeout` deliberately; a job with no policy retries forever.
- **`Queue::route()`** (Laravel 13) centralizes connection/queue routing per job class:
  `Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts')`.
- **Horizon** (5.50.0) for Redis queue supervision, balancing, and visibility.
- A **`sync` queue connection in production** is not a performance setting — it is a latency bug on
  every request that dispatches. Flag it.

## Caching — after measuring, and with a plan

- Cache the **expensive, stable, and hot**. Do not cache cheap per-request work.
- **Invalidation is the hard part.** Prefer a short TTL plus explicit `forget()` on write over clever
  long-lived keys that go stale.
- `Cache::tags()` works on Redis and not on file/database drivers — check the driver before relying
  on tag-based invalidation.
- **`Cache::touch()`** (13+) extends an existing item's TTL without retrieving and re-storing it.
- **HTTP-level caching** for public GETs: `Cache-Control`, `ETag`, conditional requests — it removes
  the request entirely instead of making it cheap.

## Runtime and infrastructure

| Lever | Note |
| --- | --- |
| **Config/route/view/event caching** | `php artisan optimize` — a **deploy** step (`optimize:clear` before rebuilding). This is one of the largest single wins for the effort |
| **OPcache** | Enabled, with `validate_timestamps=0` in production |
| **JIT** | Helps CPU-bound code; will not rescue a query-bound app |
| **Octane** (2.20.0) | Long-lived workers, large throughput gain — with hard state constraints (see `laravel-api`) |
| **FrankenPHP** | A modern application server option Laravel documents alongside Nginx |
| **Redis** for cache/queue/session | The database driver becomes a bottleneck under load, and the file session driver breaks across nodes |
| **Read replicas** | Configure them, then be deliberate about which reads may be stale |
| **CDN + compressed assets** | Vite build output, gzip/brotli, HTTP/2 or 3 |
| **Connection settings** | Persistent connections and pooling matter under high concurrency; verify rather than assume |

## What not to do

- **Caching instead of fixing the query.** The most common Laravel performance mistake.
- **Micro-optimizing PHP** in a request dominated by database I/O. Measure the split first.
- **Adding abstraction "for performance"** — a repository layer adds indirection and removes no cost.
- **Optimizing without a baseline**, so you cannot tell whether anything improved.
- **Enabling `preventLazyLoading()` in production** — it is a development guard, and it throws.
- **Assuming the dev environment reflects production**: different driver, no cache, different data
  volume, no queue workers.

## Review checklist

- [ ] A measured baseline exists before and after the change
- [ ] No N+1: every relation is eager-loaded where it is used; `withCount` for counts
- [ ] Indexes exist for new filters, joins, and sorts, added in the same migration
- [ ] Every collection endpoint or query is bounded (pagination / chunk / cursor)
- [ ] Slow or remote work is queued, with `tries`/`backoff`/`timeout` set
- [ ] No `sync` queue connection in production
- [ ] Caching, where used, has a stated invalidation strategy and a compatible driver
- [ ] `php artisan optimize` is part of the deploy, with `optimize:clear` before it
- [ ] Drivers (cache, session, queue, database) are the intended ones, confirmed via `php artisan about`
- [ ] Verified against production-shaped data volume, not a seeded dev database
