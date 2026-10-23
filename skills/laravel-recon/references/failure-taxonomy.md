# Why agents write code that needs a fix iteration

This is the document the plugin's architecture is built on. If a skill does not reduce one of the
failure classes below, it does not belong in the plugin.

## The two loops

Every wrong first attempt costs one of two loops:

- **Cheap loop (agent-caught).** Agent writes → agent verifies → agent fixes. Cost: a few cached
  turns. The user never sees it.
- **Expensive loop (user-caught).** Agent writes → user runs it → user reports the problem → agent
  fixes. Cost: a full round trip, a re-read, a rewrite, and the user's attention.

The goal is not to stop the agent writing. It is to **move failures from the expensive loop into
the cheap loop, and to stop the predictable ones entirely.**

## Two families of mistake

**Version mistakes** — an API that does not exist in the installed major. Generalizable, public,
documented. `#[Fillable]` on Laravel 11. `Cache::touch()` on 12. `wire:model` semantics across
Livewire 2/3/4. `Route::livewire()` on Livewire 3.
→ Prevented by **version gates and explicit prohibitions**.

**Environment mistakes** — code that is perfectly valid Laravel but wrong for *this* application.
A column named `price_cents` assumed to be `price`. A `ChargeInvoice` action that already exists,
duplicated. A route named `invoices.view` referenced as `invoices.show`. A config key that was
never published. A relation assumed to be `hasMany` when it is `hasOne`. The app's own naming
convention ignored.
→ Prevented only by **reading the application.** No documentation can prevent these, because the
answer exists solely in the repository.

## Failure classes

| Class | Example | Preventing mechanism | Where |
| --- | --- | --- | --- |
| **A. Version** | API absent from this major | version gates + prohibitions | `laravel-versions`, routing table |
| **B. Environment** | wrong column, duplicate action, wrong route name | read ground truth, verify assumptions | `laravel-recon`, `laravel-verify` |
| **C. Framework misuse** | N+1, missing authorization, mass assignment | conventions + review | `laravel-conventions` |
| **D. Silent stack misconfig** | Tailwind 3 syntax in a v4 app; missing maryUI `@source` | named failure modes per stack | `laravel-tailwind`, `laravel-maryui` |
| **E. Layer misuse** | business logic inside a Filament resource | layering rules | `laravel-filament`, `laravel-solid` |

## Why "more documentation" hits a ceiling

A model's Laravel knowledge is already strong. Classes **A, C, D** are recall failures under
version ambiguity, and they are cheap to fix with a gate: one line that says "this API is not
available here."

Class **B is unlearnable in advance.** It is a property of the repository, not of Laravel. Adding
another thousand lines of Laravel prose cannot reduce it by a single iteration — the model is not
confused about Laravel, it is missing a fact about *this app*.

That is the ceiling that documentation-heavy tooling reaches, and it is where this plugin
deliberately invests instead:

```
1. Recon     read the ground truth the change depends on
2. Ledger    write down every app-specific assumption the code will make
3. Verify    check each assumption against the app BEFORE emitting code
4. Preflight re-verify after writing; run the cheapest real checks
5. Record    when a human corrects the agent, write a durable project rule
```

Steps 1–4 cut class B iterations. Step 5 converts iterations already spent into permanent
prevention — the only mechanism here that **compounds**.

## The cost asymmetry that justifies the loop

A verification step costs one or two extra tool calls. A user-caught iteration costs a full round
trip, a re-read, a rewrite, and the user's attention.

Under DeepSeek's cache economics the tokens are the **cheapest** part of that — loaded context is
cached at roughly a fiftieth of fresh context, while output and round trips are what actually cost.
So the loop is not trading tokens for correctness: it is trading *a couple of tool calls* for
*round trips*, and the trade is favourable even when the check is wrong half the time.

It is not wrong half the time, either. Reading a table's real columns is deterministic: it either
matches or it does not.

## Anti-patterns that feel productive but are not

- **Adding more general Laravel prose.** Re-states what the model already knows, dilutes the
  version gates that actually bind, and cannot address class B at all.
- **Loading more skills "to be safe."** The router forbids this for a reason: an agent buried in
  context applies the specific rules worse.
- **Copying the app's schema or conventions into a skill.** They drift within a sprint. Read them
  live; record only what is *not* discoverable.
- **Assuming a reasonable default instead of checking.** The single largest generator of class B
  iterations. "Reasonable" is exactly the assumption that gets corrected.
- **Claiming a check passed without running it.** A fabricated verification is worse than an
  admitted gap, because it removes the user's reason to look.
