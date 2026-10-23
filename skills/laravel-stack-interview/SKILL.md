---
name: laravel-stack-interview
description: Ask the user to choose the stack before scaffolding a new Laravel app, or when detection is inconclusive.
---

# Decide the stack before you build

## When this skill is required

Invoke it — and do not proceed with planning or scaffolding — in any of these situations:

| Situation | Evidence |
| --- | --- |
| **No application yet** | no `artisan`, no `composer.json` requiring `laravel/framework` |
| **Framework version undetectable** | no `laravel/framework` constraint and no lock file |
| **Stack incomplete** | `laravel-stack` could not determine the rendering layer, component layer, or CSS major |
| **User asks to create a new app** | any "create / scaffold / start a new Laravel project" request |

The rule: **an undetermined stack is a blocking gap, not a detail to fill in later.** Everything
downstream depends on it — which APIs exist, which config file is canonical, which component
vocabulary applies. An agent that scaffolds first and discovers the stack second has already
written wrong code.

## Never do these

- **Never default to "the latest of everything."** A new app is a set of deliberate choices. The
  user may be matching a team standard, a host's PHP version, or a client constraint.
- **Never scaffold, then ask.** The scaffold *is* the commitment — it writes the stack into
  `composer.json`, `package.json`, and the CSS entry point.
- **Never infer the stack from "it's a Laravel app."** That fixes the framework only, not the
  rendering layer, CSS layer, or component library.
- **Never ask about anything that does not change the code.** App name, branding, and hostnames
  are not stack decisions.

## Run the interview with the host's question tool

Use the `ask` tool — multiple choice, at most 3 questions per call, 2–4 options each. Batch by
dependency: the framework version gates everything else, so it goes first. Put the recommended
option first, with a one-line `description` giving the reason.

### Round 1 — the decisions that gate everything else

1. **Laravel version** — latest 13.x (only the newest major receives bug fixes) · 12.x
   (security-fixes only) · pin to an existing team standard
2. **Rendering layer** — Blade + Alpine · **Livewire** (PHP-centric teams) · Inertia
   React/Vue/Svelte (JS-centric) · Filament-first (admin-heavy product) · API-only
3. **Component layer** — none (raw Tailwind) · **daisyUI** · maryUI (built on daisyUI) · Flux
   (official Livewire library)

### Round 2 — whatever round 1 left open

Derive everything you can from round 1 and ask only the remainder:

- **CSS / bundle** — Tailwind 4 (the Laravel 12+ default) vs Tailwind 3 (only when pinning an
  older toolchain)
- **Auth** — starter kit + Fortify · Sanctum (first-party SPA/mobile) · Passport (third-party
  OAuth2 only) · none yet
- **Data store** — PostgreSQL · MySQL/MariaDB · SQLite

### Round 3 — quality and target

- **Tests** — Pest vs PHPUnit; note the skeleton's own pin for the chosen Laravel major
- **Quality tooling** — Pint + Larastan from day one vs none yet
- **Target** — server/VPS · containers (Sail) · serverless · **desktop/mobile (NativePHP)** ·
  Filament admin only

Stop asking as soon as the answer set is complete. **Three rounds is the ceiling.** Every question
you ask that does not change a line of code is noise.

### If the run is non-interactive

If `ask` is unavailable, do **not** stall and do **not** silently pick. Choose the documented
recommended default on every axis, **state the full assumed stack prominently at the top of your
output**, mark each axis as *assumed, not chosen*, and tell the user exactly how to change it.
Continuing with a clearly-labelled assumption is correct; continuing with an invisible one is not.

## Validate coherence before recording

Do not merely record the answers — check the chains. If a choice violates a hard constraint,
surface the conflict with the specific constraint and offer the corrected pairing. Do not silently
comply, and do not silently "fix" it either.

| Constraint | Violation to catch |
| --- | --- |
| maryUI 2 ⇒ daisyUI 5 ⇒ Tailwind 4 | maryUI 2 chosen with Tailwind 3 |
| daisyUI 5 ⇒ Tailwind 4 | daisyUI 5 with Tailwind 3 |
| daisyUI 4 ⇒ Tailwind 3 | daisyUI 4 with Tailwind 4 |
| Flux ⇒ Livewire | Flux chosen without Livewire |
| maryUI ⇒ Livewire | maryUI chosen on a non-Livewire app |
| Filament ⇒ Livewire, separate surface | Filament blended into the public UI |
| One component layer per surface | daisyUI + Flux in the same markup |
| Livewire **or** Inertia, per page | both owning the same page |
| Exactly one NativePHP product | desktop and mobile packages together |

Then fold the answers into a **stack number** from
`laravel-stack/references/frontend-stacks.md`. The combination is the stack; "Livewire +
Tailwind" describes at least eight different ones.

## Record it before you build

Write `.dsh/laravel-stack.md` using the same schema as `laravel-stack`, marking every axis
`Chosen, not detected`, with the date. Then invoke `laravel-route` — the route is what turns the
decision into the skills and version rules the work must follow.

## Scaffold — then verify the scaffold matches

Only once the stack is recorded:

```bash
laravel new my-app                                   # pick the matching starter kit
laravel new my-app --using=vendor/custom-starter-kit  # custom kit
```

Then **read back what was actually generated** and confirm it matches the decision:

- `composer.json` → `laravel/framework`, `livewire/livewire`, `inertiajs/inertia-laravel`,
  `robsontenorio/mary`, `filament/filament`
- `package.json` → `tailwindcss`, `daisyui`, the client adapter
- `resources/css/app.css` → which Tailwind config model was written
- the test runner that was actually pinned

Scaffolder defaults are the scaffolder's, not the user's, and they have shifted across versions —
Breeze and Jetstream were superseded in 12 by the unified starter kits, and each kit's Tailwind and
component-layer choices moved with it. **If the scaffold produced something other than the decided
stack, say so explicitly and correct it.** Do not quietly proceed on a stack nobody chose.

Once the generated files match, confirm the recorded profile and route.

## Checklist

- [ ] No app, or inconclusive stack — this skill was invoked rather than guessed
- [ ] Framework version decided **first** (it gates the rest)
- [ ] Rendering, component, and CSS layers decided, not inferred
- [ ] Coherence chains validated; conflicts surfaced, not silently accepted
- [ ] Stack number recorded from `frontend-stacks.md`
- [ ] Profile written with *chosen* vs *detected* clearly marked
- [ ] Non-interactive: assumption stated prominently, not hidden
- [ ] Scaffold read back and confirmed to match the decision
- [ ] Route produced before the first feature was written
