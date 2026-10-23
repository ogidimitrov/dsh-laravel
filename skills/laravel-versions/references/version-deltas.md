# Laravel version deltas, 10 → 13

Sourced from the versioned upgrade guides (`https://raw.githubusercontent.com/laravel/docs/{x}.x/upgrade.md`)
and Packagist package metadata. Load this when a change touches one of these areas.

Verified: **2026-09-29**. Doc-derived headings change with documentation updates; re-fetch
the upgrade guide for the installed major when in doubt.

## Laravel 10 → 11 (the largest breaking delta)

PHP floor rises to **8.2**. Symfony console `^7.0.3`.

Doc-classified impact (from `docs/11.x/upgrade.md`):

- **High:** Updating Dependencies · Application Structure · Floating-Point Types ·
  Modifying Columns · SQLite Minimum Version · Updating Sanctum
- **Medium:** Carbon 3 · Password Rehashing · Per-Second Rate Limiting · `spatie/once`
- **Low:** Doctrine DBAL Removal · Eloquent Model `casts` Method

What this means in practice:

- **Application structure (slim skeleton).** New apps have far fewer files. The upgrade
  guide explicitly says *not* to restructure an existing Laravel 10 app — 11 is tuned to
  keep supporting the classic layout. Keep `app/Http/Kernel.php` if the app has it.
- **`casts()` method.** Models may define a `casts()` method instead of a `$casts`
  property. Both work; follow whichever the codebase already uses.
- **Carbon 3.** The biggest silent-breakage source. Date mutation semantics and some
  `diff*` return values changed. Audit date handling before upgrading.
- **Password rehashing on login** is now automatic. If the password column is not
  literally `password`, set `$authPasswordName` on the user model.
- **Doctrine DBAL removed.** Column-changing migrations no longer route through it;
  `->change()` requires the column definition to be fully restated.
- **Floating-point types / modifying columns** changed in migrations — check generated SQL
  on a copy of the real schema, not just in tests on SQLite.
- **SQLite minimum version** raised; old SQLite builds now fail.

## Laravel 11 → 12

PHP floor stays **8.2**. Symfony console `^7.2`. Presented as a low-friction upgrade —
no skeleton change.

Doc-classified impact (from `docs/12.x/upgrade.md`):

- Updating Dependencies · Updating the Laravel Installer · **Models and UUIDv7** ·
  **Carbon 3** · Concurrency Result Index Mapping · Container Class Dependency Resolution ·
  **Image Validation Now Excludes SVGs** · Local Filesystem Disk Default Root Path ·
  Multi-Schema Database Inspecting · Nested Array Request Merging

What this means in practice:

- **UUIDv7 for models.** New model UUID key generation defaults to UUIDv7 (time-ordered).
  Do not mix v4/v7 assumptions in code that sorts or indexes on the key.
- **Image validation excludes SVG.** Validation rules accepting images no longer accept
  SVG by default — a real behaviour change for any upload flow. Add explicit rules if SVG
  is genuinely wanted, and treat SVG as untrusted markup (XSS risk).
- **Nested array request merging** semantics changed — `merge()` on nested input behaves
  differently. Check any `$request->merge()` on array input.
- **Carbon 3** carries over as an upgrade concern.
- **Composer floor:** 12 requires Composer 2.2+; the Laravel installer also bumps.
- **Scaffolding changed:** Breeze and Jetstream are superseded by the unified starter kits.
  Do not reach for Breeze on a 12+ project.

## Laravel 12 → 13

PHP floor rises to **8.3**. Symfony console `^7.4 || ^8.0`. Upgrade guide includes an
**"Upgrading Using AI"** section — the project explicitly supports agent-assisted upgrades.

Doc-classified impact (from `docs/13.x/upgrade.md`):

- Updating Dependencies · Updating the Laravel Installer · **Request Forgery Protection** ·
  Cache `serializable_classes` Configuration · Database `upsert` (MySQL/MariaDB) ·
  Cache Prefixes and Session Cookie Names · Collection Model Serialization Restores
  Eager-Loaded Relations · `Container::call` and Nullable Class Defaults ·
  Domain Route Registration Precedence · `JobAttempted` Event Exception Payload ·
  Manager `extend` Callback Binding · MySQL `DELETE` With `JOIN`/`ORDER BY`/`LIMIT` ·
  Pagination Bootstrap View Names · Polymorphic Pivot Table Name Generation ·
  `QueueBusy` Event Property Rename · Session `serialization` Configuration ·
  `Str` Factories Reset Between Tests

What this means in practice:

- **Request forgery protection changed.** Review any custom CSRF/`VerifyCsrfToken`
  configuration and all state-changing endpoints.
- **Cache `serializable_classes`** — new typed-serialization safety configuration. Apps
  caching objects need review; this is the 13 equivalent of a security hardening step.
- **Session `serialization`** configuration changed — verify session payloads still
  deserialize on deploy.
- **Cache prefixes and session cookie names** changed — expect logouts / cache key misses
  on upgrade; plan it as a deploy-time event, not a surprise.
- **`Str` factories reset between tests** — tests that mutated `Str` state and relied on
  leakage between cases will now fail. Good change; fix the tests.
- **Pagination Bootstrap view names** changed — republished or overridden pagination
  views will render wrongly until updated.
- **Queue/event renames** (`QueueBusy`, `JobAttempted`) break listeners that reference
  the old property names.
- **Attribute-based configuration** (first-class PHP attributes for models and more) is
  available on 13 — a legitimate idiom here, and a fatal error on 11/12.

## Cross-version hazard summary

| Area | 10 | 11 | 12 | 13 |
| --- | --- | --- | --- | --- |
| PHP floor | 8.1 | 8.2 | 8.2 | **8.3** |
| Skeleton | classic | slim (classic still supported) | slim | slim |
| Model config attributes | no | no | no | **yes** |
| `casts()` method | property only | method or property | method or property | method or property |
| Doctrine DBAL | present | **removed** | removed | removed |
| Carbon | v2 | **v3** | v3 | v3 |
| SVG in image validation | allowed | allowed | **excluded** | excluded |
| UUID model keys | v4 | v4 | **v7 default** | v7 default |
| Test runner | PHPUnit 10 / Pest 2 | PHPUnit 11 / Pest 3 | PHPUnit 11 / Pest 3 | **PHPUnit 12 / Pest 4+** |

Treat this table as a set of *questions to ask*, not a substitute for the versioned docs.
