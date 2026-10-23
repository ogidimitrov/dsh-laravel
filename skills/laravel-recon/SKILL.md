---
name: laravel-recon
description: Read this app's real schema, routes, models, and config before writing code that must match them.
---

# Reconnaissance: read the app before you write

Most fix iterations are not caused by not knowing Laravel. They are caused by **assuming something
about this application** that the repository could have answered. A model cannot know that this
app stores money in `price_cents`, that `ChargeInvoice` already exists, or that the route is
`invoices.view` — no documentation contains that. Only the app does.

Read `references/failure-taxonomy.md` for why this matters more than more prose.

**Rule: any app-specific fact your code depends on must be read, not recalled.** An unverified
assumption about the environment is a predicted fix iteration.

## When to run this

Before writing code that touches: a table or column · a model or relation · a route name or URL ·
a config key or env var · an existing class, action, service, or trait · a view or component name ·
an event, job, or notification · a policy, gate, or permission.

For a one-line CSS change, skip it. For anything that references a name, run it.

## The probes, by question

Use the project's runtime prefix — if `laravel/sail` is installed, prefix everything with
`./vendor/bin/sail`. All commands below are verified Laravel commands.

| You need to know | Read |
| --- | --- |
| Columns, types, nullability, indexes of one table | `php artisan db:table <table>` |
| Overall database and connection status | `php artisan db:show` |
| A model's attributes, casts, and **relations** | `php artisan model:show <Model>` |
| Route names, URIs, methods, middleware, controller | `php artisan route:list` (add `--json` for precision) |
| Whether a specific route name exists | `php artisan route:list --name=<pattern>` |
| A config value, and whether the key exists at all | `php artisan config:show <key>` |
| Environment shape, package versions, drivers | `php artisan about` |
| Which migrations have run, and their batch | `php artisan migrate:status` |
| The schema as migrations describe it | `database/migrations/*` — read them, do not guess |
| Registered events and listeners | `php artisan event:list` |
| Whether failures are queued | `php artisan queue:failed` |
| Whether an abstraction already exists | search `app/` for the verb and the noun **before** creating one |

**Fallbacks when a probe is unavailable.** No database? Read the migrations and the model class.
No PHP runtime (common in a remote/read-only environment)? Read `composer.lock`, the migrations,
the models, and `routes/*.php` directly — the answer is still in the repository, just not via
artisan. Never let a missing probe downgrade into an assumption; downgrade into *reading files*.

## Search before you create

The most common class-B iteration is a **duplicate abstraction**: the app already has
`ChargeInvoice`, `InvoiceNumber` helper, `Money` cast, or a `HasTenant` trait, and the agent writes
a second, slightly different one.

Before creating any class, trait, helper, enum, scope, job, or view, search for the concept:

- the verb and noun (`Charge*`, `*Invoice`, `convertCurrency`, `money`)
- the target namespace (`app/Actions`, `app/Services`, `app/Support`)
- the model itself for an existing scope, accessor, cast, or relation

Reuse the existing one. If a parallel implementation is genuinely justified, say why explicitly.

## Write the ground truth down

Produce a short block you can cite, so the facts are visible and correctable:

```markdown
## Ground truth (read, not assumed)
- invoices: price_cents (int, not null), currency (char 3), paid_at (nullable timestamp), user_id FK
- Invoice model: relations customer() belongsTo, lines() hasMany; casts price_cents => integer
- Existing: app/Actions/ChargeInvoice.php already charges an invoice — reuse, do not duplicate
- Route: invoices.view (name), /invoices/{invoice} — not invoices.show
- Config: billing.gateway exists; billing.gateway_timeout does NOT
- Conventions: money always stored as minor units; all writes go through an Action class
```

Anything you could not read goes in the block marked `UNVERIFIED` — never silently assumed. The
ledger in `laravel-verify` consumes this.

## Rules

- **Never infer a schema from the model name.** `Invoice` tells you nothing about column names.
- **Never infer a route name from a controller method.** Laravel does not enforce the convention.
- **Never assume a config key exists** because the framework documents a similar one; it may not
  be published in this app (`config/` is slim on 11+).
- **Never assume a relation's cardinality.** `hasMany` vs `hasOne` vs `belongsToMany` changes the
  code, the eager-loading, and the migration.
- **Read the migrations, not just the live schema,** when you are about to add one — you need to
  know the intended order and existing indexes.
- **Cite what you read.** "The column is `price_cents`" must be traceable to a probe or a file, not
  to plausibility.

## Checklist

- [ ] Every column, table, and relation the change touches was read, not assumed
- [ ] Every route name referenced was confirmed to exist
- [ ] Every config key referenced was confirmed to exist
- [ ] Existing abstractions for the same concept were searched for and reused
- [ ] A ground-truth block was written, with anything unresolved marked `UNVERIFIED`
- [ ] The project's runtime prefix (Sail or bare) was used consistently
