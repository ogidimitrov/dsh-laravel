---
name: laravel-route
description: Route a detected Laravel stack to the exact skills and version knowledge that apply, before planning work.
---

# Route this application to the right skills

Turns the stack profile into a concrete, version-gated plan. This is the step that makes the
rest of the plugin effective: without routing, an agent loads either too little (generic
advice) or everything (diluted context).

Run this **after** `laravel-stack` and **before** planning or writing code.

## Always show the context banner

The user must be able to see, at a glance, which skills are in play and **for which versions**. Emit
this block at the top of your first response after routing, and re-emit it whenever the route
genuinely changes:

```
▸ laravel · Laravel 12.69.3 · PHP 8.2 · slim skeleton
   skills      conventions · solid · versions(§11→12) · blade-livewire(Livewire 4.x)
               · tailwind(4.x) · daisyui(5.x) · recon · verify
   sources     whats-new@2026-09-29 · docs.laravel.com/12.x · routing-table@2026-09-29
   not routed  api · inertia · filament · nativephp
```

Rules for the banner:

- **Every skill lists its version gate** where one applies (`tailwind(4.x)`, `versions(§11→12)`).
  A skill without a version is one that is genuinely version-independent.
- **Sources carry their verified date** when they came from an embedded reference. That date is the
  reader's only signal for how stale the knowledge might be.
- **`not routed` is required.** It is how a user spots a gap — if `laravel-api` is missing from a
  task that clearly needs it, that is a bug they can see and report.
- **Never list a skill you did not actually invoke.** Naming a skill injects nothing; claiming it is
  loaded when it is not is a fabricated verification.
- **Keep it to five lines and stable.** Do not re-emit an identical banner every turn — that is
  noise. Re-emit only when a skill is added, a version changes, or the task moves to a different
  layer.

### Making it appear on every prompt

This plugin cannot draw UI or inject standing instructions — DSH loads skills on demand, and a
bundle manifest has no instruction contribution. So there are exactly two mechanisms, and they are
worth stating plainly:

| Mechanism | Coverage | Cost |
| --- | --- | --- |
| The banner above, mandated by this skill | Appears whenever routing runs — i.e. on any real Laravel task | Free |
| A short block in the project's `AGENTS.md` | Appears on **every** prompt, because DSH loads that file into the cache-stable system prompt at session boot | Cached, so effectively free per request |

For always-on visibility, add this to the repository's `AGENTS.md`:

```markdown
## Laravel context banner
At the start of every response in this repository, print a banner:
▸ laravel · <Laravel version> · <PHP version> · <skeleton era>
   skills      <skills currently in context, each with the version it applies to>
   sources     <references/sources used, with their verified dates>
   not routed  <routed-away skills>
Maximum five lines. Never list a skill you have not actually invoked.
```

That is the honest answer to "will I see which skills are included on every prompt": **yes, if the
banner convention is in a project instruction file** — otherwise it appears on the prompts where the
agent actually routes, which in practice is every Laravel task.

## 1. Get the profile

Read `.dsh/laravel-stack.md`.

- **Missing, or no application exists** → run `laravel-stack` first, which will hand off to
  `laravel-stack-interview` when there is nothing to detect. Do not route from assumption, and
  never invent a stack to route against.
- **Stale** (versions no longer match `composer.lock` / `package-lock.json`) → refresh it first.
- **Fields marked `unknown`** → invoke `laravel-stack-interview` to decide **just those axes**
  with the user. Do not silently fill them, and do not guess a "reasonable default": a wrong
  version route is worse than no route, because it looks authoritative.

A route built on an assumed stack is the most dangerous output this plugin can produce — it
carries the authority of the routing table while describing an application that does not exist.

## 2. Route each dimension

Consult `references/routing-table.md` and match every signal present in the profile.

Load always-on skills unconditionally (`laravel-conventions`, `laravel-solid`) plus
`laravel-versions` whenever the work touches anything version-sensitive.

Route each of these dimensions independently, then merge:

| Dimension | From the profile |
| --- | --- |
| Framework + skeleton era + PHP | `framework`, `skeleton`, `php` |
| Rendering | `front end`, `livewire`, `inertia`, `filament`, `folio` |
| CSS / JS | `tailwindcss`, `daisyui`, `alpinejs`, `react`/`vue`/`svelte`, `vite` |
| Auth | `fortify`, `sanctum`, `passport`, `breeze`/`jetstream` |
| Data / async | `DB_CONNECTION`, `QUEUE_CONNECTION`, `horizon`, `reverb`, `octane` |
| Quality | `pest`, `phpunit`, `pint`, `larastan`, `rector`, `sail`, `dusk` |

A dimension with no signal contributes no skill. A dimension with several signals (e.g.
Filament **and** Inertia **and** API routes) contributes **all** matching skills — they are
layers, not alternatives.

## 3. Emit the version knowledge pack

This is the part that "injects the right version knowledge": from the routed version
sections, write out the condensed rules that constrain *this* app. Not the whole matrix —
only the applicable lines.

```markdown
## Version knowledge in force

Framework: Laravel 12.69.3 (constraint ^12.0) — PHP ^8.2 — security-fixes only
Skeleton:  slim (bootstrap/app.php, bootstrap/providers.php, routes/console.php)

Applies:
- Middleware/providers/exceptions are configured in bootstrap/app.php, not a Kernel
- API routes exist only because install:api was run; keep them versioned
- Image validation excludes SVG by default — uploads must opt in explicitly
- Model UUID keys default to v7 (time-ordered) — do not assume v4
- Carbon 3 semantics: audit date mutation and diff* return values
- Test runner is PHPUnit ^11 (Laravel 12 skeleton pin)

Unavailable here (would be fatal or wrong):
- Attribute-based model config (#[Table], #[Fillable]) — Laravel 13+ only
- Cache::touch() — Laravel 13+ only
- Slim-structure migration of a classic app — explicitly advised against by Laravel
```

Keep it to the rules that would actually change a line of code. A knowledge pack that
restates general Laravel advice has failed at its job.

## 4. Name the doc sources for this exact version

Give the agent the sources that match the installed versions. Substitute the **installed**
major in every URL.

- Laravel framework: `https://laravel.com/docs/{x}.x`, upgrade guide at
  `https://raw.githubusercontent.com/laravel/docs/{x}.x/upgrade.md`
- Library with an official machine-readable index → use it, and check its declared version
  against the installed one:
  - daisyUI: `https://daisyui.com/llms.txt`
  - Filament: `https://filamentphp.com/docs/llms.txt`
- Library with **no** official `llms.txt` (Tailwind, Livewire, Inertia) → say so explicitly
  and use the versioned prose docs instead. Do not fabricate a machine-readable source.
- Nothing upstream exists at all, or the library is outside this plugin's coverage → **Context7** is
  the fallback: `https://context7.com/{org}/{repo}/llms.txt`, or the MCP server
  (a `dsh-mcp-client` entry named `context7`: `command: npx`, `args: ["-y", "@upstash/context7-mcp"]`). It is **secondary**: not `llms.txt`
  format, version selection by `topic` rather than path, and its corpus is derived from the project's
  own docs. Never let it outrank an upstream source for the installed version.
- `laravel/boost` present → note it as an additional optional source of version-matched
  guidelines. This plugin does not require it and must work identically without it.

## 5. Report the route

```markdown
## Route

Load, in order:
1. laravel-conventions            (always)
2. laravel-solid                  (always)
3. laravel-versions               → version-deltas.md §11→12
4. laravel-blade-livewire         → references/livewire-versions.md §4
5. laravel-flux
6. laravel-tailwind               §4
7. laravel-daisyui
8. laravel-alpine
9. laravel-filament
10. laravel-testing

Verification loop (always-on, not optional):
11. laravel-recon          — BEFORE writing: read the schema, routes, config, and existing
                             abstractions this change depends on
12. laravel-verify         — BEFORE declaring done: assumption ledger + cheapest falsifying checks
13. laravel-project-rules  — AFTER a correction: make it permanent

Not routed (no signal): laravel-inertia · laravel-api · laravel-volt · laravel-tooling
Assumptions carried: <list any `unknown` resolved by assumption>
```

Then load the routed skills — in order, with the named version section. Loading a skill is
what actually injects its guidance; naming it in a list without invoking it does nothing.

## Hard rules

- **Route before writing code, not after.** A route produced to justify code already written
  is theatre. Re-route when the profile changes.
- **Never drop a routed skill because it seems irrelevant.** If a dimension is in the
  profile, its skill applies. If you believe it does not, say why explicitly.
- **Never broaden a route to "be safe".** Loading every skill dilutes context and buries the
  version-specific rules that matter. Route narrowly and precisely.
- **Version gates are absolute.** If the pack says an API is unavailable on this version, do
  not use it and do not "upgrade the project to use it" unless the user asked for an upgrade.
- **Reuse, don't re-derive.** If a valid route already exists in this session for an
  unchanged profile, reuse it instead of re-routing.
- **The verification loop is part of the route, not an extra.** A route that lists the right
  stack skills but omits `laravel-recon` and `laravel-verify` has only prevented the version
  failures — the class-B failures (wrong column, duplicate action, non-existent route name) still
  get through, and those are the ones that consume iterations.
