---
name: laravel-grill
description: Interrogate the plan before writing code, so nothing is written while syntax confidence is missing.
---

# The confidence gate

**Writing code is a claim of confidence.** Before emitting any, you must be able to answer one
question honestly: *am I sure this syntax is correct, for this version, in this application?*

That surety decomposes into a chain. **You may not advance past a link you cannot establish.**

```
intent  →  packages  →  version  →  syntax  →  fit
```

- **Intent** — what change is actually wanted, and what "done" means. Not the literal words of the
  request; the behaviour being asked for.
- **Packages** — which packages this app actually has, and which of them the change touches.
- **Version** — which major of each. Syntax is a property of the version, not of the library.
- **Syntax** — the exact form for that version: prefix, namespace, registration, signature.
- **Fit** — does it belong here: this app's naming, schema, existing abstractions, layer.

Break the chain anywhere and the code you write is a guess wearing a confident face. Guesses here do
not fail loudly — they fail at runtime, in review, or in production, and cost an iteration each time.

## The distinction that makes this work

Taken from the `grill-me` pattern, and it is the whole discipline:

> **Facts about the codebase are your job. Decisions are the user's.**

- A **fact** is discoverable: what columns `invoices` has, which route is named `invoices.view`,
  whether `ChargeInvoice` already exists, what `pest` resolves to. **Look it up. Never ask.** Asking
  the user for something already in the repository is the failure this skill exists to prevent
  (`laravel-recon` is the mechanism).
- A **decision** is not discoverable: whether refunds should be partial, whether to add a second
  gateway now, whether breaking the API contract is acceptable. **Ask. Never decide silently.**

Most bad agent output comes from getting this backwards: deciding silently and asking about facts.

## When to run this — and when not to

Run it when the change has **decisions that are expensive to reverse**: data shape, auth model,
public API contract, a new class family, a package choice, a migration.

**Do not run it** for:

| Skip when | Why |
| --- | --- |
| The change is fully constrained — one obvious local fix | There is nothing to resolve |
| Iteration is fast and reversible — a style tweak, a view detail | You will see the result immediately |
| Prose, formatting, comments, a rename | No syntax risk |
| You already have the answer from `laravel-recon` | The chain is already established |

**Grilling is a cost, and it backfires as a tax on trivial work.** A skill that fires on every change
gets ignored on the changes that matter. Route it by the *reversibility* of the decision, not by the
size of the diff.

## What this gate is not

**It is a convention, not a lock.** Some implementations let a skill declare that only a human may invoke it. DSH exposes exactly that: `user-invocable: false` keeps a skill out of the human surface, and `disable-model-invocation: true` keeps the model from selecting it. Both are UI-level switches, not a security boundary, so this gate stays a convention with real teeth rather than a lock.

Two consequences, plainly:

- The routing condition above is **the agent's own judgement, not enforcement.** Nothing technically
  prevents it from grilling a trivial change; only the instruction does.
- The pinned skills index advertises every enabled skill to the model by name and description, so the
  model can always choose to invoke this one. The routing table simply gives it no reason to.

What *is* dependable: `/laravel:grill` when the user asks for it, and the checklist below when the
skill does run.

## The gate

Classify every link in the chain, honestly:

| State | Meaning | May you write code? |
| --- | --- | --- |
| **Established** | Verified — you read it, ran it, or fetched the version's page | Yes |
| **Assumed** | A named default, with the reason, and you disclosed it | Only if reversing it is cheap |
| **Unknown** | You do not actually know | **No.** Resolve it or stop |

Rules for the gate:

- **An unlabelled assumption is a violation.** "Assumed" with a stated reason is fine; silent
  plausibility is not.
- **Unknown + expensive to reverse → stop and ask.** Do not pick the most likely option and move on.
- **Unknown + cheap to reverse → proceed, but say so.** Name it as an assumption in the output.
- **Never write syntax you cannot cite.** If you cannot point to the version's documentation, this
  plugin's table, or the app itself, you do not know it.

## Asking well

When a link needs the user, use the `ask` tool:

- **One question at a time when the answers are dependent.** Batching dependent questions destroys
  the order that makes the interview converge — a later question's options depend on the earlier
  answer. Batch only genuinely independent questions (the host allows up to three).
- **Every question carries a recommended answer and the reason.** The user should be able to say
  "yes to your suggestion". An open question with no proposal transfers your work back to them.
- **Frame the consequence.** "If we make it `hasMany`, the migration needs a foreign key on the child
  and the eager-load changes. Recommend `hasMany`." Not "one-to-many or many-to-many?".
- **Stop asking when the frontier is empty.** Not when you are bored, and not after a fixed count.

`laravel-stack-interview` is the same discipline applied to the stack itself. Use that one for "which
stack is this"; use this one for "what are we building, and am I sure how".

## Where "I don't know" goes

Saying it is expected, not a failure. The plugin has somewhere to put it:

| Unknown | Resolve by |
| --- | --- |
| Which column / route / config key | `laravel-recon` — read it |
| Whether the syntax exists on this version | `laravel-versions/references/syntax-by-version.md` |
| The exact API for the installed major | Fetch the version-scoped page (`whats-new.md` lists the URLs) |
| A package's prefix or registration | `laravel-stack/references/package-syntax-map.md`; confirm registration-dependent prefixes in the app |
| Intent, scope, or an expensive design choice | Ask the user, with a recommendation |

If none of those settle it, **say so plainly and stop** rather than writing something plausible. A
stated gap costs one question. A confident guess costs an iteration and your credibility.

## Leave an artifact

The known weakness of the `grill-me` pattern is that the findings evaporate — the agent forgets them
next session. This plugin has durable surfaces, so **a grill session must leave something behind**:

- Resolved **facts** → `.dsh/laravel-stack.md` (and `laravel-recon`'s ground-truth block)
- Recurring **decisions** → a project rule via `laravel-project-rules`, so it is not re-asked
- Structural **choices** → the five-line decision record from `laravel-design-decision`

Grilling without recording is paying the cost and discarding the benefit.

## Anti-patterns

| Anti-pattern | Why it is wrong |
| --- | --- |
| Asking the user for a fact that is in the repo | Wastes their attention on your lookup |
| Deciding silently and asking about facts | Exactly backwards — the root cause of misalignment |
| Five dependent questions in one batch | Destroys the dependency order; answers arrive unusable |
| Questions with no recommended answer | Transfers the thinking back to the user |
| Grilling a one-line fix | Kills the skill's credibility for the changes that matter |
| Writing the code, then asking "is this right?" | The gate is *before* the code, or it is not a gate |
| Treating "assumed" as "established" | The most dangerous state, because it feels like knowledge |

## Checklist

- [ ] Intent stated, not just the literal request
- [ ] Packages identified — facts looked up, not asked
- [ ] Version resolved for every package the change touches
- [ ] Syntax citable from the version's docs, this plugin's tables, or the app
- [ ] Fit checked against existing abstractions (`laravel-recon`, search before create)
- [ ] Every link classified: established / assumed / unknown
- [ ] No unknown link with an expensive-to-reverse decision left open
- [ ] Each question carried a recommendation and its reason
- [ ] Assumptions disclosed in the output, not buried
- [ ] Outcome recorded — profile, project rule, or decision record
