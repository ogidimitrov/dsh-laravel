---
name: laravel-verify
description: Verify assumptions and run the cheapest real checks before declaring Laravel work done.
---

# Verification: close the loop before the user has to

A wrong first attempt that *you* catch costs tokens. The same attempt caught by the user costs a
round trip and trust. This skill exists to move failures from the second category into the first —
and to make sure a claimed check was actually run.

Run this **before** saying the work is done. See `laravel-recon/references/failure-taxonomy.md`.

## 1. Build the assumption ledger

List every app-specific fact your code depends on. Take the ground-truth block from
`laravel-recon`, then add anything the *written* code assumes — not only what you planned:

```markdown
| Assumption | Status | How |
| invoices.price_cents exists as integer | verified | db:table invoices |
| route invoices.view exists | verified | route:list --name=invoices |
| ChargeInvoice::handle accepts an Invoice | verified | read the class |
| billing.gateway_timeout is configured | **assumed** | not found in config/billing.php |
| InvoicePolicy::charge exists | **unverified** | no policy found for Invoice |
```

Rules for the ledger:
- Every external name the code references appears in it: columns, tables, relations, routes,
  config keys, classes, methods, events, jobs, views, policies, permissions, env vars.
- `assumed` and `unverified` are **findings**, not footnotes. Each one is a predicted iteration.
- Do not upgrade a status without doing the work that earns it.

## 2. Run the cheapest check that can falsify your most likely error

Order checks by *probability of catching your error* ÷ *cost*, not by thoroughness. In practice:

| Tier | Check | Catches |
| --- | --- | --- |
| 0 | grep/LSP for each referenced symbol: class, method, route name, config key, view, event | wrong or non-existent names — the most common class-B error, and nearly free |
| 1 | `vendor/bin/pint --test <changed files>` | syntax errors, parse failures |
| 2 | `vendor/bin/phpstan analyse <changed paths>` at the project's configured level | wrong signatures, undefined members, type errors |
| 3 | Compare code against the schema (`db:table`, migration, `model:show`) | column/relation mismatches |
| 4 | `php artisan test --filter=<Relevant>` (or the project's own script) | behavioural breakage |
| 5 | `php artisan migrate --pretend`, or migrate + rollback on a scratch database | unsafe or irreversible migrations |
| 6 | Hit the route / run the command (only when genuinely cheap) | wiring errors |

Stop when the likely error is covered. Tier 0 and 1 together are usually a few seconds and catch
most of it.

**The project's own commands win.** Read `composer.json` → `scripts`; if it defines `test`,
`lint`, or `analyse`, run those. Prefix with `./vendor/bin/sail` when Sail is present — a bare
`php` may be the wrong runtime.

## 3. Report honestly

```
Verified:      invoices.price_cents (db:table) · route invoices.view (route:list)
Assumed:       billing.gateway_timeout — not found in config; code will use the default path
Unverifiable:  the queued job's runtime behaviour — no queue worker and no DB in this environment
Not run:       full test suite (would take ~4 min); ran --filter=InvoiceTest only
```

Three things are forbidden:
- **Claiming a check passed without running it.** A fabricated verification is worse than a stated
  gap, because it removes the user's reason to look.
- **Silently skipping a check because it is inconvenient.** Say "not run" and why.
- **Reporting a green result for a check that did not actually execute** (exit code ignored, wrong
  path, no tests matched). Confirm it ran and what it covered.

## 4. Fix, don't explain

When a check fails, fix the code. Do not:
- explain why the failure is probably fine,
- weaken the check (raising a PHPStan baseline, adding an ignore, loosening a test),
- report the failure as a follow-up item when it is cheap to fix now.

If a check reveals a genuine problem outside the scope of the change, say so separately — but fix
what you broke.

## 5. Re-check what you assume, not what you wrote

The ledger covers the *current* state of the code. If you changed a signature, a migration, a
route name, or a policy method, search for **existing callers** before finishing — a rename that
misses one caller is the classic self-inflicted iteration.

## Checklist

- [ ] Ledger built from the *written* code, not just the plan
- [ ] Every referenced name checked to exist (tier 0)
- [ ] Formatter/parse check run on changed files
- [ ] Static analysis run on changed paths, no new ignores or baseline entries added
- [ ] Schema references match the real schema
- [ ] Focused tests run — and actually executed
- [ ] Migrations checked for safety; no irreversible step on real data
- [ ] Callers of anything renamed or re-signatured updated
- [ ] Report distinguishes verified / assumed / unverifiable / not run
