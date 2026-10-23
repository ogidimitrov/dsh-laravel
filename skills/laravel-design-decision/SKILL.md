---
name: laravel-design-decision
description: Decide whether a design pattern is warranted before adding structure, and price its overhead.
---

# Design decisions: evaluate before you structure

Invoke this whenever the answer to "how should this be built?" is not obvious — a new class family,
an interface, a service or repository layer, an event, a driver, a strategy, or a request to
"do it properly".

The governing principle, and the one that keeps Laravel codebases maintainable:

> **The default is no new abstraction.** A design pattern is not a mark of quality. It is a cost
> paid in advance for a specific kind of change you expect to happen. If you cannot name that change,
> the pattern is pure overhead.

See `references/patterns.md` for the catalogue and each pattern's fit criteria and overhead.

## When this applies

| Trigger | Why it needs evaluating |
| --- | --- |
| A new interface, base class, or trait | Abstractions are the hardest thing to remove later |
| A repository, service, or manager layer | The classic Laravel over-abstraction |
| An event/listener where one listener is planned | Indirection without payoff |
| A driver/strategy/registry | Real flexibility cost for possibly-hypothetical variation |
| A DTO or value object | Sometimes right; often a shim over an array |
| "How should we structure X?" | A genuine architectural fork |
| A correction rejected your approach | The user's taste is data; record it via `laravel-project-rules` |

For a single-file change with no new structure, skip this.

## The evaluation process

**1. State the decision in one sentence, and the expected change.**
"Where should invoice charging live? — We expect a second payment provider within a quarter."
Without a named expected change, stop: you are about to build for a future nobody has described.

**2. Does the framework already solve it?**
Laravel ships validation, authorization, events, queues, scheduling, caching, HTTP clients,
notifications, localization, pipelines, and the service container. Prefer the framework. A bespoke
solution to a solved problem is the most common architectural waste in Laravel.

**3. Does this repo already have an abstraction for it?**
Run the search-before-create step from `laravel-recon`. Duplicating an existing `Action` or helper
is the same defect as duplicating a column.

**4. Is there a real variation axis — with more than one implementation?**
One implementation plus one vague future is **not** an axis. Two concrete implementations, or an
explicitly planned second, is. If there is one implementation, write it concretely; extracting later
is cheap, and un-extracting is not.

**5. If warranted, pick the smallest pattern that fits.**
Consult `references/patterns.md` and choose the least structure that covers the named change. An
Action over a Repository-plus-Service-plus-DTO stack, unless the change genuinely requires the rest.

**6. Price the overhead explicitly.**
Count what you are adding:

| Overhead | Ask |
| --- | --- |
| Files added | How many files must a new engineer read to follow one request? |
| Indirection layers | How many hops from route to effect? |
| New vocabulary | Does this introduce a term the codebase did not have? |
| Container bindings | Does it need a binding/testing seam, or could it be concrete? |
| Cognitive load | Can you explain the structure in one sentence? If not, it is too much |

The test: **if the abstraction cannot be explained in one sentence and justified by a named expected
change, do not add it.**

**7. Record the decision.**
Five lines, in the PR or a project rule — not a document nobody reads:

```markdown
## Decision: charging lives in an Action, not a Service + Repository
Context:    invoices need charging; a second gateway is expected in Q3
Considered: (a) inline in the controller, (b) Action class, (c) Service + Repository + DTO
Chosen:     (b) — one named change, one file, testable with a faked gateway
Overhead:   1 file, 1 constructor dependency. Rejected (c): 3 layers for one implementation
```

## The null option is a real option

"No new abstraction — use the framework and an existing class" must be evaluated, and it wins by
default. Recording it explicitly prevents the next session from re-proposing the same layer that was
already rejected.

If a pattern was proposed and rejected, that is a **project rule** — capture it with
`laravel-project-rules` so it is not re-litigated every session.

## Overhead traps to refuse

| Trap | Why it is waste |
| --- | --- |
| Repository for every model | Eloquent *is* the data-access layer; a pass-through hides queries and removes nothing |
| Interface with one implementation and no planned second | Speculative seam; add it when the second arrives |
| DTO for a two-field payload | An array or typed parameters are clearer |
| Event for one synchronous listener | Indirection with no deferral or decoupling benefit |
| Base `*Service` / `*Manager` / `*Helper` catch-alls | Named after nothing; grows unrelated methods forever |
| Abstraction "for consistency" with another area | Symmetry is not a requirement |
| Pattern because the codebase already uses it elsewhere | Match the *problem*, not the wardrobe |

## Relationship to SOLID

`laravel-solid` says dependency inversion is for *volatile* dependencies, and warns against
mechanical abstraction. This skill is that warning operationalised into a procedure. Run this before
you add structure; run `laravel-solid` while you write it.

## Checklist

- [ ] The decision and the expected change are stated in one sentence
- [ ] The framework's own mechanism was considered first
- [ ] The repo was searched for an existing abstraction
- [ ] Variation is real (two implementations or an explicit plan), not hypothetical
- [ ] The **null option** was evaluated and is the default
- [ ] The chosen pattern is the smallest that covers the change
- [ ] Overhead is stated: files, layers, vocabulary, explanation length
- [ ] The decision was recorded in five lines
- [ ] A rejected approach was captured as a project rule
