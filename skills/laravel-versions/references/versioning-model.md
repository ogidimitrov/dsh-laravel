# The three layers of version knowledge

Answering "what changed in this version?" properly requires separating three layers, because they
have completely different risk, cost, and shelf life. Conflating them is why version guidance
either goes stale or gets ignored.

## Layer 1 — General idiom (version-independent)

*How Laravel does things. How daisyUI does things. How Filament does things.*

Conventions, structure, opinions, and the canonical way to accomplish a task. This layer is stable
across majors: a controller validates through a Form Request, a policy governs authorization, a job
is idempotent, a Blade component declares `@props`. Nearly everything an engineer learns about
Laravel transfers unchanged.

**Carried by:** `laravel-conventions`, `laravel-solid`, and the "how this library works" sections of
each stack skill.
**Strategy:** learn once, apply always. This is where the bulk of an agent's knowledge should live,
because it does not expire.

## Layer 2 — Major deltas (breaking) — highest priority

Laravel's own documented policy:

> Major framework releases are released every year (~Q1), while minor and patch releases may be
> released as often as every week. **Minor and patch releases should never contain breaking
> changes.**

That single sentence is the whole risk model: **all backward-compatibility risk is concentrated at
the major boundary.** So majors get absolute priority, and a major boundary is the only place an API
can vanish.

- **What broke** → `version-deltas.md`
- **What now exists** → `whats-new.md`
- **Which versions exist at all** → `ecosystem-matrix.md`

**Strategy:** gate absolutely. Never write a version-specific API without confirming the major. Every
item in this layer is a candidate fix iteration, and unlike layer 1 it is entirely avoidable.

## Layer 3 — Minor and patch (additive)

Non-breaking **by policy**. New methods, new options, new flags, deprecations, bug fixes. This layer
ships as often as weekly.

**Do not embed this layer.** It changes too fast; embedding it is precisely how a version matrix goes
stale and starts teaching the wrong thing with confidence. Instead, act on **evidence**:

| Evidence | Action |
| --- | --- |
| A feature you expect is missing | Read the release notes for the installed minor — it may be newer or older than you assume |
| A deprecation warning appears | Read the release notes for the version that introduced the deprecation and act before it becomes a major |
| Behaviour differs from the docs | Confirm the exact patch in `composer.lock`; check that version's notes |
| You need to know whether a method exists | Fetch the page for the installed major (see `whats-new.md`) — a method present in a *newer* minor is not available on yours |

**Where minor detail lives:** `laravel/framework` GitHub releases and `CHANGELOG`, the library's own
releases page, and the exact version from `composer.lock`.

## Priority order

1. **Major boundary first.** Always. It is the only layer that breaks code.
2. **General idiom second.** It covers most of what you will write.
3. **Minor only on evidence.** Never speculatively, because it cannot break you.

## The named-arguments trap (Laravel, official)

Laravel's release notes state explicitly:

> Named arguments are not covered by Laravel's backwards compatibility guidelines. We may choose to
> rename function arguments when necessary.

So this is **not** protected across minors:

```php
// Named argument — parameter names may be renamed between minor releases
$this->dispatch(job: $job, delay: 60);
```

Prefer positional arguments when calling framework methods you do not control. Most engineers
believe named arguments are always safe because PHP guarantees them; Laravel opts out of that
guarantee. It is a genuinely non-obvious way to break on a minor upgrade.

## Support status (official table)

| Laravel | PHP | Released | Bug fixes until | Security fixes until |
| --- | --- | --- | --- | --- |
| **13** | 8.3 – 8.5 | 2026-03-17 | Q3 2027 | 2028-03-17 |
| **12** | 8.2 – 8.5 | 2025-02-24 | 2026-08-13 (ended) | 2027-02-24 |
| 11 | 8.2 – 8.4 | 2024-03-12 | 2025-09-03 (ended) | 2026-03-12 (ended) |
| 10 | 8.1 – 8.3 | 2023-02-14 | 2024-08-06 (ended) | 2025-02-04 (ended) |

For every release: **18 months of bug fixes, 2 years of security fixes.** Only the latest major of
first-party libraries gets bug fixes. No LTS since Laravel 6. `^13.0`-style constraints are
required because majors break.

## Cadence differs per ecosystem — do not project Laravel's policy

| Ecosystem | Major cadence | Layer-2 risk |
| --- | --- | --- |
| Laravel | ~yearly, Q1 | Contained and documented; upgrade guide per major |
| **Livewire** | irregular | **Severe.** 2 → 3 changed binding semantics and inverted `wire:model`; 4 changed routing, config keys, and `make:livewire` output |
| **Tailwind CSS** | irregular | 4 was a **configuration rewrite**, not an increment. v3 syntax fails silently |
| **daisyUI** | tracks Tailwind | 5 requires Tailwind 4 — a cross-package constraint semver cannot express |
| **Filament** | irregular | Namespaces and schema APIs move every major; do not port across |
| **NativePHP** | desktop and mobile version **independently** | 4 replaced the UI model (SuperNative); 3 restructured plugins |
| PHP / npm packages | semver | Additive on minors, but watch cross-package constraints (daisyUI ↔ Tailwind is the model case) |

The rule this implies: **a library major is breaking until its own docs say otherwise.** Semver
promises only apply if the maintainer honours them, and Tailwind did not.

## Resolution procedure

1. Read the exact installed version from `composer.lock` / `package-lock.json`.
2. Locate it in `ecosystem-matrix.md` → which major, and which support band.
3. Apply the **major** layer: `version-deltas.md` (what broke) + `whats-new.md` (what exists).
4. If still unresolved, fetch the mounted major's docs page — never recall.
5. Only on evidence, check the **minor** via the library's release notes.

## Maintenance

Layer 1 ages slowly — revisit when a convention genuinely changes. Layer 2 must be re-verified at
every major release. Layer 3 is never written down here, by design.
