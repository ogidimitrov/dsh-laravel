# Architectural patterns for Laravel — fit, overhead, and when to skip

The catalogue `laravel-design-decision` consults. Ordered by how often each is the right answer in a
Laravel application — which is not the same as how often it is used.

Each entry gives the **named change** that justifies it. If you cannot name that change, skip it.

## Group A — the framework's own patterns (reach here first)

These are not "design patterns you add". They are Laravel's built-in structure, and they are almost
always the correct answer to the problem they solve.

| Pattern | Right when | Overhead |
| --- | --- | --- |
| **Form Request** | Any non-trivial input | One file per operation |
| **Policy / Gate** | Any authorization decision | One file per model; enforced everywhere |
| **API Resource** | Any JSON output contract | One file per resource; prevents leaking columns |
| **Middleware** | Cross-cutting request concern | One file; runs for a route group |
| **Eloquent scope** | Reusable query constraint | One method; composes |
| **Model cast / accessor** | Value shaping at the persistence boundary | One method |
| **Queued Job** | Work that can be deferred or retried | One file; needs idempotency |
| **Notification / Mailable** | Outbound message on a channel | One file per message |
| **Scheduled task** | Recurring work | `routes/console.php` (11+) or the console Kernel |
| **Pipeline** | Ordered transformation with optional steps | One class per step; Laravel's `Pipeline` drives it |

**If the framework has a mechanism, using it is not "adding a pattern" — it is the default.** Group
A entries need no evaluation beyond "does it apply".

## Group B — business-logic structure (the common real choices)

| Pattern | Right when | Overhead | Skip when |
| --- | --- | --- | --- |
| **Action / command class** | One named business operation with a clear trigger (`ChargeInvoice`, `IssueRefund`) | 1 file, 1 public method | The operation is a single framework call |
| **Service class** | Several related operations share dependencies and state of mind (`BillingService` with charge/refund/reconcile) | 1 file, N methods — watch it becoming a catch-all | You only have one operation → use an Action |
| **Value Object** | A value with invariants and no identity (`Money`, `DateRange`, `Email`, `VatNumber`) | 1 small class + casts | It is a plain scalar with no invariant |
| **PHP Enum** | A closed set of values (`OrderStatus`, `PaymentMethod`) | 1 file | The set is open or database-driven |
| **DTO / data object** | A structured payload crossing a boundary (job payload, external API shape, view model) | 1 class + mapping | Two or three fields → typed parameters |
| **Event + Listener** | Side effects that should not block the caller, or that several consumers need | 2 files per event; harder to trace | One synchronous listener that never multiplies |
| **Observer** | Model lifecycle side effects (audit, cache invalidation) | 1 file; implicit and easy to forget | The effect belongs in the Action that made the change |
| **Domain exception** | A failure the caller must handle distinctly | 1 class; enables precise `catch` | A generic `RuntimeException` already reads clearly |

## Group C — patterns for genuine variation (add only with a second implementation)

| Pattern | Right when | Overhead | Skip when |
| --- | --- | --- | --- |
| **Strategy + registry** | Two or more interchangeable algorithms, selected at runtime (payment gateways, exporters, tax rules) | Interface + 1 class per variant + a binding/registry | There is one implementation and no committed second |
| **Adapter / gateway** | Wrapping a third-party SDK behind your own interface so it is swappable and fakeable in tests | Interface + 1 implementation + a binding | You call the SDK in one place and will not test it directly |
| **Decorator** | Cross-cutting behaviour around an existing boundary (cache, retry, logging, metrics) | 1 wrapper + a binding; can nest confusingly | The concern belongs inside the implementation |
| **Specification** | Complex, composable, reusable business criteria | 1 class per rule; verbose | Eloquent scopes express it clearly |
| **State machine** | Many transitions with guards, and the valid state graph is genuinely complex | A library plus config, or a hand-rolled transition table | A handful of statuses → explicit methods (`markPaid()`) that validate and throw |

**The test for Group C:** can you name the second implementation, concretely? "We might add one" is
not a second implementation. Extraction later is cheap; removal later is not.

## Group D — already implemented by the framework (do not hand-roll)

| Pattern | Laravel already provides |
| --- | --- |
| **Singleton** | The service container — `singleton()` |
| **Facade** | `Illuminate\Support\Facades\*` — do not add your own unless it earns its place |
| **Builder** | The query builder and Eloquent |
| **Chain of responsibility** | Middleware |
| **Factory** | Model factories; `make()` on the container |
| **Iterator** | Collections, `LazyCollection`, `cursor()` |
| **Observer** | Model events, `booted()` hooks |
| **Strategy** | The `Manager`/driver pattern (`Cache`, `Queue`, `Filesystem`) — follow that shape |
| **Template method** | Prefer composition; Laravel's own inheritance is shallow by design |
| **Command bus** | Queued jobs and `Bus` — a bespoke command bus is almost always waste |

Hand-rolling one of these is a defect, not a design decision.

## Group E — be suspicious by default

| Pattern | Why it is usually waste in Laravel |
| --- | --- |
| **Repository over Eloquent** | Eloquent *is* the data-access abstraction. A pass-through repository adds indirection, hides query power, and removes nothing. Legitimate only for a genuine data-source swap or a hard invariants boundary |
| **Generic `BaseRepository` / `BaseService`** | Named after nothing; accumulates unrelated methods; forces every consumer through the lowest common denominator |
| **DTO-per-layer mapping chains** | Three mappings to move four fields; the mapping code outlives the shape it was written for |
| **Event for a single synchronous listener** | Adds a file, a dispatch, and a tracing hop, and buys nothing until a second consumer exists |
| **Interface for every class** | Speculative seams. Interface the *volatile boundary*, not the codebase |
| **Abstract base controller with shared helpers** | Couples unrelated controllers; helpers usually belong in a service or a trait with one purpose |
| **Microservice/hexagonal ceremony inside a monolith** | Ports and adapters for in-process calls add layers with no boundary to protect |

## Choosing: the shortest path that fits

1. **Framework mechanism exists?** Use it. (Group A / D)
2. **Existing abstraction in this repo?** Use it. (`laravel-recon`, search before create)
3. **One operation, one trigger?** An Action. (Group B)
4. **A value with invariants?** A Value Object or Enum. (Group B)
5. **Two real implementations?** Strategy/Adapter behind an interface. (Group C)
6. **None of the above?** Write it concretely, where it is used, and extract when the second case
   actually appears.

That order is deliberate: every step down adds overhead, and step 6 is a legitimate, often correct,
answer.
