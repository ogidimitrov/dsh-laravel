---
name: laravel-conventions
description: Apply idiomatic Laravel conventions and avoid the standard correctness, security, and performance mistakes.
---

# Laravel conventions that hold on every version

These rules are version-independent. They apply to any change in any Laravel app. When a
rule conflicts with the app's existing, consistent pattern, **follow the app** — but say so
if the existing pattern is unsafe.

## Use the framework before inventing

Laravel already ships validation, authorization, events, notifications, queues, scheduling,
caching, rate limiting, localization, and HTTP clients. Reach for a package or a bespoke
abstraction only when the framework genuinely lacks the capability. Every layer you add is
a layer the next engineer must learn.

Generate with the framework so files land in the right place and shape:

```bash
php artisan make:model Invoice -mfsc     # model, migration, factory, seeder, controller
php artisan make:request StoreInvoiceRequest
php artisan make:resource InvoiceResource
php artisan make:policy InvoicePolicy --model=Invoice
php artisan make:job SendInvoiceEmail
php artisan make:action CreateInvoice    # 13+; otherwise create the class by hand
```

## Controllers stay thin

A controller is a transport adapter: accept input, authorize, delegate, return a response.

- **Validate in a Form Request**, not in the controller body and never only in the view.
- **Authorize explicitly** — `$this->authorize(...)`, `Gate::authorize(...)`, or a policy.
  Registration does not imply authorization.
- **Delegate the work** to a dedicated action/service/job. Business rules in a controller
  cannot be reused, scheduled, or tested in isolation.
- **Return a Resource** for JSON, a view/Inertia page for HTML, or a redirect. Do not
  return raw Eloquent models from API endpoints.

```php
public function store(StoreInvoiceRequest $request, CreateInvoice $createInvoice): RedirectResponse
{
    $invoice = $createInvoice->handle($request->validated());
    return to_route('invoices.show', $invoice);
}
```

## Eloquent and the database

- **Kill N+1 queries.** Eager load with `with()`/`load()`; in development use
  `Model::preventLazyLoading()`. A loop that touches a relation is an N+1 until proven otherwise.
- **Select what you need.** `select()` the columns you use; avoid `SELECT *` on wide tables.
- **Never `Model::all()`** on an unbounded table. Use pagination, `chunkById()`, or `cursor()`.
- **Prefer the query builder / Eloquent** to raw SQL. If you must write raw SQL, use
  **bindings** — never interpolate variables into the SQL string.
- **Mass assignment is a security boundary.** Declare `$fillable` (preferred) or `$guarded`
  deliberately. Never pass `$request->all()` or `$request->input()` into `create()`/`update()`;
  pass `$request->validated()`. Never leave privileged columns (`is_admin`, `role_id`,
  `status`, `user_id`) fillable unless they are intentionally client-settable.
- **Migrations are append-only history.** Do not edit a migration that has already run in
  production; add a new one. Keep schema migrations free of irreversible data operations.
- **Index what you filter and join on**, and declare foreign keys. Add indexes in the same
  migration that introduces the query pattern.
- **Transactions** wrap multi-write invariants (`DB::transaction`), not whole request lifecycles.

## Security defaults

- **Escape output.** `{{ }}` is escaped; `{!! !!}` is not. Use `{!! !!}` only for markup you
  generated or sanitized. Treat stored SVG as untrusted markup.
- **Authorize every state-changing request**, not just the ones behind a login route.
- **Validate before you trust.** Validation is not authorization; both are required.
- **Hash passwords** with the configured hasher; never store or log plaintext or reversible values.
- **Rate-limit** login, password reset, OTP, and any expensive endpoint.
- **Signed URLs** for anything the user should not be able to guess (downloads, one-click actions).
- **Do not leak internals** in error responses in production: no stack traces, SQL, file
  paths, or existence-disclosing 404-vs-403 differences for private resources.
- **Secrets live in `.env`**, never in committed code, config defaults, or logs.

## Configuration and environment

- **Never call `env()` outside `config/`.** With `php artisan config:cache`, `env()` returns
  `null` everywhere else — a classic production-only failure. Use `config()` in application code.
- Add new settings to a config file with a sensible default, then read them via `config()`.
- Anything cached (`config`, `route`, `view`, `event`) must be cleared in the deploy step.

## Queues, jobs, and scheduled work

- **Jobs must be idempotent.** Retries and duplicate delivery are normal, not exceptional.
- Set `$tries`, `$backoff`, and `$timeout` deliberately; the defaults are not a policy.
- Use `ShouldBeUnique` / `WithoutOverlapping` where duplicate execution is genuinely harmful.
- **Pass identifiers, not large object graphs**, and beware stale models in long jobs —
  re-fetch inside `handle()`.
- A `sync` queue connection in production is a latent timeout bug. Flag it.
- Scheduling lives in `routes/console.php` on 11+ and in the console Kernel on ≤10 — use
  the location the app actually has.

## Errors and observability

- Fail loudly. Never `catch` an exception only to swallow it; if you must recover, log with
  context and rethrow or convert to a domain error.
- Catch the narrowest exception type you can handle meaningfully.
- Use `report()` for unexpected failures and structured logging (`Log::withContext`) over
  string concatenation.
- Do not log secrets, tokens, full request payloads, or personal data.

## Match the codebase

- Run the project's formatter before declaring done (`vendor/bin/pint`, or the configured script).
- Match the existing naming: singular `PascalCase` models, plural snake_case tables,
  `*Controller`, `*Request`, `*Resource`, `*Policy`, `*Service`/`*Action`.
- Follow the app's existing test runner and directory layout — do not introduce Pest into a
  PHPUnit app or vice versa.
- Reuse existing base classes, traits, and helpers rather than creating parallels.

## Anti-patterns to refuse

| Anti-pattern | Why it is wrong | Do instead |
| --- | --- | --- |
| Logic in Blade templates | Untestable, invisible to the API | Move to the controller/action or a view model |
| `Model::unguard()` / `guarded = []` globally | Mass-assignment vulnerability | Explicit `$fillable` |
| `env()` in application code | Breaks under config caching | `config()` |
| Query inside a loop | N+1 | `with()` / `whereIn` / single aggregate query |
| Fat controllers with SQL inline | Untestable, duplicated | Action class + Form Request + Resource |
| `return Model::all();` from a controller | Unbounded memory, leaks columns | Paginate + Resource |
| Validation in the view only | Trivially bypassed | Form Request + server-side validation |
| `try { } catch (\Exception $e) {}` | Silently corrupts state | Catch narrowly, log, rethrow |
| Editing a shipped migration | Diverges environments | New migration |
