---
name: laravel-solid
description: Write SOLID, dependency-injected Laravel code without over-abstracting the framework.
---

# SOLID in Laravel

SOLID is a means to testability and change-safety, not a file-count target. Laravel's
container, facades, and Eloquent already solve many problems — apply the principles to
*your* domain code and leave the framework's own seams alone.

The test for every abstraction you add: **what change does this make cheaper, and would a
reader thank me?** If you cannot answer, do not add it.

**Before adding structure, run `laravel-design-decision`.** That skill turns this warning into a
procedure — whether a pattern fits at all, which one, and what overhead it costs. Use *this* skill
while writing SOLID code; use *that* one to decide what to write.

## S — Single responsibility

One reason to change per class. In Laravel the natural units are:

| Kind of logic | Home |
| --- | --- |
| HTTP concerns (auth, input shape, response) | Controller / Form Request / Resource |
| A single business operation | Action or Service class (`app/Actions`) |
| Cross-cutting business rules for one model | Model method or query scope |
| Access rules | Policy |
| Side effects that can be deferred | Job / Event listener |

```php
// One job: charge an invoice. Not "InvoiceManager" doing five things.
final readonly class ChargeInvoice
{
    public function __construct(private PaymentGateway $gateway) {}

    public function handle(Invoice $invoice): Payment
    {
        // single operation, single reason to change
    }
}
```

**Smell:** a class named `*Manager`, `*Helper`, or `*Service` with unrelated methods — name
it after the one operation it performs (`ChargeInvoice`, `SendInvoiceReminder`).

## O — Open/closed

Extend behaviour by adding a class and binding it, not by editing a growing conditional.

- Replace `switch ($type)` dispatch with a registry/resolver: an interface plus one
  implementation per variant, resolved by the container or an explicit map.
- Use Laravel's `Manager`/driver pattern shape for pluggable backends.
- Prefer **events + listeners** over appending `if` branches to an existing workflow.

```php
// Instead of: if ($payment->method === 'card') {...} elseif (...) {...}
interface PaymentHandler { public function charge(Payment $payment): Receipt; }

final class PaymentHandlerRegistry
{
    /** @param array<string, PaymentHandler> $handlers */
    public function __construct(private array $handlers) {}

    public function for(string $method): PaymentHandler
    {
        return $this->handlers[$method]
            ?? throw new UnsupportedPaymentMethod($method);
    }
}
```

Adding a payment method becomes a new class plus one binding — no edit to a branch chain.

## L — Liskov substitution

A subtype must honour the parent's contract. In practice:

- Do not make a model/class extend another purely to reuse code if the "is-a" statement is
  false. Composition is almost always the better Laravel answer.
- Do not widen preconditions or narrow postconditions in an override — if
  `Repository::find()` is documented to return `Model|null`, an implementation that throws
  is a violation.
- Prefer **interfaces + small implementations** over deep inheritance chains. Laravel's
  own single-level `Illuminate\*` inheritance is the pattern to imitate, not to exceed.

## I — Interface segregation

Declare narrow interfaces at the **call site's** needs, not the implementation's inventory.

```php
// Good: the consumer needs one capability.
interface GeneratesInvoicePdf { public function for(Invoice $invoice): string; }
```

**Smell:** a 20-method `InvoiceRepositoryInterface` where every test double stubs 19
irrelevant methods. Split it, or pass what is actually needed.

## D — Dependency inversion

Depend on abstractions for the things that are **volatile** — external services, clocks,
randomness, mail, payments, file storage, third-party APIs. Inject them via constructor and
bind them in a service provider.

```php
// app/Providers/AppServiceProvider.php  (or a dedicated provider)
$this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
```

```php
final class RefundOrder
{
    public function __construct(
        private PaymentGateway $gateway,   // abstraction, swappable in tests
        private Clock $clock,              // determinism
    ) {}

    public function handle(Order $order): Refund { /* ... */ }
}
```

Test doubles then replace the volatility **without touching the framework**:

```php
$this->swap(PaymentGateway::class, new FakePaymentGateway());
// or: $this->mock(PaymentGateway::class)->shouldReceive('refund')->once();
```

## Where SOLID stops in Laravel

Over-application is as damaging as under-application, and it is the more common failure in
Laravel codebases. Do **not**:

- Wrap Eloquent in a generic `BaseRepositoryInterface` for every model. Eloquent *is* the
  data-access abstraction; a pass-through repository adds indirection and removes query
  power. Add a repository only when you genuinely need to swap the data source or enforce a
  complex invariants boundary — and then scope it to that aggregate.
- Create an interface for every class "for testability". If a class has no volatile
  dependency and no second implementation, test the concrete class directly.
- Replace facades mechanically. Facades are testable (`Facade::fake()`, `Http::fake()`,
  `Queue::fake()`) and are the documented public API. Resolve facades to constructor
  injection at boundaries where you need to swap behaviour, not everywhere.
- Abstraction that hides a one-line query behind three files. Deleting indirection is a
  valid refactor.
- "Service" classes that just proxy the model: `$this->invoice->update($data)`.

## Applying it to an existing codebase

1. Find the **seam that the current change needs** — usually one controller action or job.
2. Extract the volatile dependency behind an interface; bind it; inject it.
3. Leave untouched code alone. Broad rewrites are a separate, explicitly requested task.
4. Add a test that proves the new seam (fake the boundary, assert the outcome).

Never restructure working code that your change does not touch. A refactor mixed into a
feature change is unreviewable.

## When the user corrects you on design

A design correction is a signal, not a preference to argue with. Handle it in this order:

1. **Comply in the code you are writing.** Do not defend the abstraction or re-propose it "for
   consistency" elsewhere.
2. **Check the blast radius.** If the corrected pattern appears in code you did not write, leave it
   — do not sweep the codebase in the same change.
3. **Capture it as a project rule** via `laravel-project-rules`, naming the failure it prevents. A
   rejected approach repeated in the next session is the design equivalent of a fix iteration.
4. **Do not over-correct.** If the user asks for a concrete Action instead of a repository, do not
   respond by inlining everything. Apply the correction at the seam they named.

The same applies to a **self-observed** pattern you keep reaching for: if you have proposed a
repository layer twice in one project, record the decision once and stop proposing it.

## Server-driven and UI-layer code

SOLID does not apply only to backend classes. In Livewire/Filament code the equivalent disciplines
are: keep server state on the server, keep domain logic out of the component or resource, delegate
to the same Action the rest of the app uses, and inject volatile dependencies rather than reaching
for facades inside `render()`. See the matching stack skill.
