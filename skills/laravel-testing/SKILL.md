---
name: laravel-testing
description: Write and run Laravel tests using the project's actual runner, without testing the framework.
---

# Laravel testing

## Match the runner the project already uses

Read `composer.json` → `require-dev`, then `composer.json` → `scripts` for the real command.

| Detected | Runner | Where tests live |
| --- | --- | --- |
| `pestphp/pest` | Pest | `tests/Feature`, `tests/Unit`, `tests/Pest.php` |
| `phpunit/phpunit` | PHPUnit | `tests/Feature`, `tests/Unit`, `phpunit.xml` |

Do not add Pest to a PHPUnit project or vice versa. The runner major matters too, and **Pest majors
track PHPUnit majors** — Pest 5 → PHPUnit 13, Pest 4 → PHPUnit 12, Pest 3 → PHPUnit 11, Pest 2 →
PHPUnit 10. Check `composer.lock` before writing test syntax; the mapping and its upgrade notes are
in `laravel-versions/references/syntax-by-version.md`. Note also that **Laravel's skeleton pins its
own PHPUnit major** (`^12.5.12` on 13, `^11.5.3` on 12), which is not the newest standalone release.

Run the project's configured script first (`composer test`, `composer lint`), then narrow:

```bash
php artisan test --filter=InvoiceTest        # artisan test wraps both runners
php artisan test --parallel                  # if the project uses parallel testing
vendor/bin/pest tests/Feature/InvoiceTest.php
vendor/bin/phpunit --filter test_it_charges
```

## What to test

- **Feature tests are the default.** An HTTP test through the router, middleware, policy,
  validation, and database proves the behaviour a user cares about. Unit-test a pure class
  when it has real branching logic; don't unit-test glue.
- **Never test the framework.** `assertTrue(true)`, asserting Eloquent's own query builder,
  or testing that validation exists in Laravel is noise.
- **Test the outcome**, not the implementation: database state, response status/shape,
  dispatched jobs, sent mail — not private method calls or property values.
- **One behaviour per test**, named as the behaviour (`it_prevents_charging_an_already_paid_invoice`).

## Data and isolation

- **Factories**, not hand-built arrays. Add states (`->paid()`, `->for($customer)`) instead
  of repeating setup.
- `RefreshDatabase` (or `DatabaseTransactions` where appropriate) on anything touching the DB.
  Never let a test write to a real database — check the connection in `phpunit.xml`/`.env.testing`.
- **Seeders**: reference the ones that exist; don't invent a seeding strategy per test.
- Test against the **same database engine as production where possible**. Behaviour that
  passes on SQLite and fails on PostgreSQL (ordering, strict typing, JSON, migrations) is a
  common and expensive class of bug.

## Fakes over mocking the framework

Prefer Laravel's fakes at real boundaries — they are the sanctioned seam:

```php
Http::fake([...]);            Queue::fake();        Bus::fake();
Event::fake();                Mail::fake();         Notification::fake();
Storage::fake('s3');          Time::freeze();       Carbon::setTestNow();
```

- `Queue::fake()` then `Queue::assertPushed(ChargeInvoice::class)` — assert *what* was
  dispatched, and return early; don't also run the job inline unless you're testing it.
- `Event::fake()` in tests that dispatch domain events as a side effect.
- Freeze time for any date-dependent assertion. Comparing against `now()` in the test is a
  flaky test.
- Mock only the volatile boundaries you own (payment gateways, clocks, third-party clients) —
  the same interfaces `laravel-solid` recommends injecting. If you cannot fake a boundary,
  that is a design signal.

## Assertions that matter

```php
$response->assertOk()->assertJsonStructure(['data' => [['id', 'number']]]);
$response->assertForbidden();                       // authorization, not just "no button"
$response->assertSessionHasErrors('email');
$this->assertDatabaseHas('invoices', ['status' => 'paid']);
$this->assertDatabaseCount('payments', 1);
Queue::assertPushed(ChargeInvoice::class, fn ($job) => $job->invoice->id === $invoice->id);
```

**Always test the negative security case:** an unauthorized user gets `403`, another user's
resource is `404`/`403`, invalid input gets `422`, and an unauthenticated request gets `401`
on API routes. These are the tests that catch real vulnerabilities.

## Version-specific test caveats

- **Laravel 13 resets `Str` factories between tests.** Tests that mutated `Str` state and
  relied on leakage into later tests will now fail — fix the tests, don't fight the framework.
- Pest 4 type coverage and mutation testing are available but opt-in; don't enable them as
  part of an unrelated change.
- Attribute-based PHPUnit metadata (`#[Test]`, `#[DataProvider]`) is the modern form; legacy
  docblock annotations still work but match whatever the file already uses.

## Review checklist

- [ ] Runner and syntax match the project's installed major
- [ ] Test asserts behaviour/outcome, not internals or the framework
- [ ] Factories and database isolation used; no real DB targeted
- [ ] Fakes used at real boundaries; time frozen where dates matter
- [ ] Negative cases covered (403 / 404 / 422 / 401)
- [ ] Tests run and pass — the reported result is from an actual run, not an expectation
