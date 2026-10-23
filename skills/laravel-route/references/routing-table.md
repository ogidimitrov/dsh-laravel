# Routing table

Maps a verified stack-profile signal to the skills and version knowledge the agent must load.
The router (`laravel-route`) consumes this file; so does anyone auditing why a skill was
loaded.

Signal keys match the field names in `.dsh/laravel-stack.md`.

## Always-on (no signal required)

| Condition | Load | Why |
| --- | --- | --- |
| Any Laravel change | `laravel-conventions` | Correctness, security, and performance rules valid on every version |
| Any code you write or restructure | `laravel-solid` | Design discipline, and where to stop |
| Any version-sensitive API | `laravel-versions` | Gates every other decision. `references/versioning-model.md` for which layer you are in: idiom (stable) · major (breaking, priority) · minor (additive). `references/syntax-by-version.md` for **whether a syntax feature exists on this version** |
| **Any decision about how to structure something** — a new interface, service/repository layer, event, driver, DTO, or "how should we build X?" | **`laravel-design-decision`** | Evaluates whether a pattern is warranted at all, which one, and its overhead. The default is **no new abstraction** |
| **Any code written against a detected package** — Livewire, Flux, Filament, maryUI, Inertia, daisyUI, NativePHP, Fortify, Sanctum, Pennant, Folio, Wayfinder | **`laravel-stack`** → `references/package-syntax-map.md` | The correct **prefix / namespace / registration** for the installed major. Registration-dependent Blade prefixes must be confirmed in the app, never inferred |

## The verification loop (always-on, not signal-gated)

This is the part that actually reduces iterations. Failure class B — code that is valid Laravel but
wrong for *this* app — cannot be prevented by documentation, only by reading the application. See
`laravel-recon/references/failure-taxonomy.md`.

| Condition | Load | Why |
| --- | --- | --- |
| Any change that references an app-specific name (table, column, relation, route, config key, class, method, view, event, policy) | **`laravel-recon`** | Read the ground truth before writing. The dominant source of fix iterations is an assumed fact about the environment |
| Any change that creates a class, trait, helper, job, or view | **`laravel-recon`** | Search before create — the second dominant source is a duplicate of an abstraction that already exists |
| **A change with decisions that are expensive to reverse** — data shape, auth model, public API contract, a new class family, a package choice, a migration — or the user asks to be grilled | **`laravel-grill`** | The pre-write confidence gate: walks *intent → packages → version → syntax → fit* and refuses to advance past an unresolved link. **Conditional, not always-on** — it backfires as a tax on trivial changes |
| **Always**, before declaring work done | **`laravel-verify`** | Build the assumption ledger, run the cheapest checks that falsify the likely error, report honestly |
| Immediately after a human correction, or a repeated self-observed mistake | **`laravel-project-rules`** | Convert the spent iteration into a durable project rule. The only mechanism here that compounds |

Routing notes:
- `laravel-recon` and `laravel-verify` are **not optional**. If the profile is known but the app's
  actual schema/routes/config were never read, the route is incomplete and class-B iterations are
  inevitable.
- `laravel-grill` **is** conditional. Route it by the *reversibility* of the decisions, never by diff
  size — a one-line change to an auth check deserves it; a 200-line view refactor does not.
- Skip `laravel-recon` only for changes that reference no app-specific name (pure prose, a
  self-contained utility, a formatting tweak).
- `laravel-verify` runs even when the change looks trivial — tier 0 (symbol existence) costs
  almost nothing.

## Before there is a stack

| Signal | Load | Why |
| --- | --- | --- |
| No application (no `artisan`, no `laravel/framework` constraint) | **`laravel-stack-interview`** | Nothing to detect. The stack must be chosen before anything is created |
| Framework version undetectable | **`laravel-stack-interview`** | A missing gate cannot be routed around |
| A code-changing axis is `unknown` (rendering / component layer / CSS major) | **`laravel-stack-interview`**, scoped to those axes | Ask for the gap rather than filling it with a plausible default |
| Greenfield request ("create a new Laravel app") | **`laravel-stack-interview`** → then route | Choose, validate coherence, record, scaffold, verify the scaffold |

`laravel-stack-interview` is the **only** skill that runs before a profile exists. Everything else
in this table requires one; it is what produces one when detection cannot.

## Backend / framework

| Signal | Load | Version gate / check |
| --- | --- | --- |
| `framework: 13.x` | `laravel-versions` → `references/version-deltas.md` §12→13 | PHP `^8.3` floor. Attribute-based model config is legal here and **only** here. Request-forgery, cache `serializable_classes`, session serialization, pagination view names, `Str` test resets || `framework: 12.x` | `laravel-versions` → §11→12 | PHP `^8.2`. UUIDv7 model keys; image validation excludes SVG; nested array merge semantics. Security-fixes-only — say so |
| `framework: 11.x` | `laravel-versions` → §10→11 | PHP `^8.2`. **EOL** — flag it. Carbon 3, Doctrine DBAL removed, `casts()` method, slim-vs-classic skeleton |
| `framework: 10.x` | `laravel-versions` → §10→11 (forward) | PHP `^8.1`. **EOL** — flag it. Classic skeleton is authoritative; do **not** propose slim-structure migration |
| `skeleton: classic` (`app/Http/Kernel.php` exists) | `laravel-versions` §4 | Middleware/providers/schedule live in the Kernel. Never write `bootstrap/app.php` config into a classic app |
| `skeleton: slim` (`bootstrap/app.php`) | `laravel-versions` §4 | Config lives in `bootstrap/app.php`, `bootstrap/providers.php`, `routes/console.php` |
| `php: 8.4+` | `laravel-conventions`, `laravel-versions` | Property hooks, asymmetric visibility, `new` in initializers are legal; on 8.2/8.3 they are fatal |
| `octane: present` | `laravel-api` (Octane section) | Long-lived workers: no request state in singletons/statics. Behavioural class of bug |

**Cutoff escalation.** If the installed major postdates what the model knows — commonly the newest
one — load `laravel-versions` → `references/whats-new.md` **in addition to** the delta section. The
delta says what *broke*; `whats-new` teaches what *exists*, which is what a post-cutoff model is
missing. And if neither covers an API, fetch
`https://laravel.com/framework/docs/{x}.x/{page}.md` for the installed major — never fill the gap
from recall. For Filament, `https://filamentphp.com/docs/{x}.x/{path}.md`.

## Rendering / front end

Pick every layer that is present; they are not mutually exclusive.

| Signal | Load | Version gate / check |
| --- | --- | --- |
| Blade views, no Livewire | `laravel-blade-livewire` (Blade section) | Escaping, `@props` components, no logic in views |
| `livewire/livewire: 4.x` | `laravel-blade-livewire` → `references/livewire-versions.md` §4 | Deferred binding by default, `@Computed`, Form objects, `#[Locked]` |
| `livewire/livewire: 3.x` | same, §3 | `#[Computed]` present; `.live` required for eager binding |
| `livewire/livewire: 2.x` | same, §2 | `wire:model` was eager; `getXProperty()` computed; legacy `$rules` |
| `livewire/flux: present` | `laravel-flux` | Free vs Pro tier changes available components |
| `livewire/volt: present` | `laravel-volt` | Volt components are Livewire components — `laravel-blade-livewire` still applies |
| `inertia-laravel: 3.x` + `@inertiajs/{react,vue3,svelte}: 3.x` | `laravel-inertia` | **Match the client adapter to the framework.** Prop contract, deferred props, `useForm` |
| `front end: none`, `routes/api.php` present | `laravel-api` | Resources, versioning, allowlists, IDOR |
| `filament: 5.x` | `laravel-filament` | Panel/schema API moves every major — read the installed major's docs |
| `filament: 4.x` / `3.x` / `2.x` | `laravel-filament` + re-check namespaces | Do not port syntax across Filament majors |
| `folio: present` | `laravel-tooling` (Folio) | File-based routing coexists with `routes/*.php`; check both before adding a route |
| `wayfinder: present` | `laravel-tooling` (Wayfinder) | Use generated route helpers instead of hand-written URLs |

## CSS / JS

| Signal | Load | Version gate / check |
| --- | --- | --- |
| `tailwindcss: 4.x` | `laravel-tailwind` §4 | **CSS-first**: `@import "tailwindcss"`, `@theme`, no `tailwind.config.js`, `@tailwindcss/vite` plugin. Reproducing v3 config syntax here is the classic failure |
| `tailwindcss: 3.x` | `laravel-tailwind` §3 | `tailwind.config.js` + `@tailwind` directives + PostCSS pipeline |
| `daisyui: 5.x` | `laravel-daisyui` | **Requires Tailwind 4.** Fetch the official `llms.txt` before writing markup |
| `daisyui: 4.x` | `laravel-daisyui` | Targets Tailwind 3. Component/class set differs from 5 |
| `alpinejs: 3.x` | `laravel-alpine` | Alpine 3 plugin set; keep Alpine state local-only and never shadow Livewire state |
| `react: 19.x` / `vue: 3.x` / `svelte: 5.x` | `laravel-inertia` (client section) | Svelte 5 runes ≠ Svelte 4; React 19 changes form/action APIs |
| `vite: 8.x` + `laravel-vite-plugin: 3.x` | `laravel-tailwind`, `laravel-inertia` | Plugin and Vite majors must be compatible; a mismatch is a build failure, not a style issue |
| `robsontenorio/mary: 2.x` | `laravel-maryui` | **Requires daisyUI 5 + Tailwind 4.** The chain maryUI→daisyUI→Tailwind must hold. Check the `@source` line for mary's component PHP files — without it everything renders unstyled |
| `robsontenorio/mary: 1.x` | `laravel-maryui` | daisyUI 4 + Tailwind 3 era; v1 docs site is deprecated |

For the full composition of a front-end stack — Tailwind install modes, Livewire rendering modes,
component layers, and which combinations are coherent — read
`laravel-stack/references/frontend-stacks.md`. Route by **stack number**, not by "Livewire +
Tailwind", which describes at least eight different stacks.

## Auth

| Signal | Load | Check |
| --- | --- | --- |
| `fortify: present` | `laravel-conventions` (Security) + `laravel-api` if API | Headless backend — enforcement lives in Fortify actions + policies, not the UI |
| `sanctum: present` | `laravel-api` | Token abilities, expiry, `statefulApi()` for SPA |
| `passport: present` | `laravel-api` | Only for third-party OAuth2 consumers |
| `breeze` / `jetstream: present` | `laravel-versions` §11→12 | **Superseded** from 12. Legacy app — do not extend the scaffolding; do not propose it for new work |

## Data / async

| Signal | Load | Check |
| --- | --- | --- |
| `DB_CONNECTION=sqlite` | `laravel-testing`, `laravel-conventions` | Tests vs production engine divergence is the risk; 11+ raised the SQLite floor |
| `DB_CONNECTION=pgsql` | `laravel-conventions` | JSONB, `pgvector`; never write MySQL-only SQL |
| `DB_CONNECTION=mysql|mariadb` | `laravel-conventions` | 13 changed `upsert` and `DELETE ... JOIN/ORDER BY/LIMIT` behaviour |
| `QUEUE_CONNECTION=sync` (production) | `laravel-conventions` (Queues) | **Flag it** — latent timeout bug |
| `horizon` / `reverb` / `octane` present | `laravel-api`, `laravel-conventions` | Supervision, WebSockets, worker-state safety |

## Native / distribution

| Signal | Load | Check |
| --- | --- | --- |
| `nativephp/desktop: 2.x` | `laravel-nativephp` | Desktop 2.x keeps a **real request cycle** — normal Laravel semantics. Bootstrapping in `NativeAppServiceProvider::boot()` |
| `nativephp/electron` + `nativephp/laravel` | `laravel-nativephp` | Legacy desktop v1 line. Do not mix with the v2 package |
| `nativephp/mobile: 4.x` | `laravel-nativephp` | **SuperNative**: `native:` components, not a web view. Persistent runtime constraints apply. Standalone plugins that became core now conflict |
| `nativephp/mobile: 3.x` | `laravel-nativephp` | Web-view UI + plugin architecture. Persistent runtime from 3.1: **`Kernel::terminate()` does not fire during use**, no request-scoped state in singletons, background work via the queue worker |
| Both desktop **and** mobile packages present | flag as a defect | The `native:*` commands collide; a project must pick one product |

Any NativePHP app is still a Laravel app: `laravel-conventions`, `laravel-solid`, and the
version rules all apply. This skill only layers the shell-specific constraints on top.

## Production concerns

| Signal | Load | Check |
| --- | --- | --- |
| Any change with a performance or scale dimension — queries, listings, exports, reports, jobs, caching, or a deploy step | **`laravel-performance`** | Impact-ordered: N+1 → indexes → unbounded sets → work that belongs in a queue → caching last. Measure a baseline before and after |
| Any change touching authentication, authorization, input, uploads, or output | **`laravel-conventions`** → `references/security-checklist.md` | The auditable list. Authorization is the highest-yield section — a model with no policy that is exposed to users is a finding |
| `laravel/pulse`, `laravel/telescope`, `laravel/nightwatch`, or `laravel/horizon` present | `laravel-performance` | Use them to find real bottlenecks instead of guessing; all of them must be behind auth |
| Lighthouse/Pulse/Horizon mounted publicly | flag as a finding | Operational data exposed to anyone who guesses the path |
| Scheduled or requested plugin maintenance | **`laravel-update`** | The research-and-update loop: re-verify against primary sources, then **prune** |
| A finished change, before merging, or when the user asks for a review | **`laravel-review`** | Read-only subagent audit against the *same resolved version*: version correctness, security/IDOR, N+1, conventions, and missing negative test cases. Run it after `laravel-verify`, not instead of it |

## Quality

| Signal | Load | Check |
| --- | --- | --- |
| `pestphp/pest: 5.x` | `laravel-testing` | Pest 5 on PHP `^8.4` — verify the project's PHP allows it |
| `pestphp/pest: 4.x` / `3.x` / `2.x` | `laravel-testing` | Syntax differs across majors; match the installed one |
| `phpunit/phpunit: ^12` (Laravel 13 skeleton) | `laravel-testing` | `#[Test]`/`#[DataProvider]` attributes; not the same as the PHPUnit 13 standalone release |
| `phpunit/phpunit: ^11` (Laravel 12 skeleton) | `laravel-testing` | |
| `pint` / `larastan` / `rector` present | `laravel-tooling` | Run the project's configured command, not a default |
| `sail: present` | `laravel-tooling` | All commands should go through Sail (`sail artisan …`) — bare `php` may not have the right PHP |
| `dusk: present` | `laravel-testing` | Browser tests: use sparingly, they are slow and flaky |
| `laravel/boost: present` | record in the profile only | Optional official agent tooling. This plugin does not depend on it |

## Precedence and conflict rules

1. **Project over plugin.** A project-scoped skill (e.g. forged by `laravel-stack-forge`)
   beats this plugin's skill of the same bare name. Never fight it; read it and comply.
2. **Specific beats general.** `laravel-daisyui` wins over `laravel-tailwind` for component
   markup; `laravel-blade-livewire` wins over `laravel-inertia` for a given view.
3. **No structure beats structure.** `laravel-design-decision` must be able to name the change a
   pattern buys. Absent a named change, the framework mechanism or concrete code wins.
3. **Layer, don't replace.** Inertia + API both present → `laravel-api` owns the server
   contract, `laravel-inertia` owns the page contract. Both load.
4. **Filament is always additive.** It never replaces the rendering skill for the public app.
5. **Version gates are hard.** If the routed version section says an API is 13-only and the
   app is 11, the API is unavailable — there is no "close enough".
6. **Unresolved signal → interview, don't assume.** If a code-changing axis is `unknown`, invoke
   `laravel-stack-interview` for that axis. Do not fill it with a plausible default, and do not
   merely "state an assumption" — an assumed stack produces a route that looks authoritative while
   describing an application that does not exist.
7. **No application → the interview is the entry point.** Nothing else in this table can apply
   until a stack exists and is recorded.

## Output contract

The router produces:

1. **Routed skills** — ordered, deduplicated, each with the version gate that applies.
2. **Version knowledge pack** — the condensed, applicable rules only (from the routed
   version sections), so the agent does not have to load every reference.
3. **Doc sources for this exact version** — versioned Laravel docs URL, plus `llms.txt`
   where one officially exists (daisyUI, Filament) and an explicit note where none does.
4. **Prohibitions** — the specific APIs that are wrong on this version.
5. **Skipped dimensions** — what was deliberately not routed, so gaps are visible.

## Reference index

Every reference in the plugin, and the question that should make you load it. References are on
demand, so this is the map — nothing here is loaded until a task needs it.

| Reference | Load it when |
| --- | --- |
| `laravel-stack/references/stack-catalog.md` | Identifying or recommending a stack; deciding between rendering layers |
| `laravel-stack/references/frontend-stacks.md` | A front-end combination needs naming or checking (the 13 canonical stacks + coherence rules) |
| `laravel-stack/references/package-syntax-map.md` | **Writing code against any detected package** — the correct prefix/namespace/registration |
| `laravel-versions/references/versioning-model.md` | Deciding which *layer* a change is: idiom (stable) / major (breaking) / minor (additive) |
| `laravel-versions/references/version-deltas.md` | Doing anything version-sensitive on Laravel 10–13 (what broke) |
| `laravel-versions/references/whats-new.md` | The installed version postdates your knowledge (what exists now) |
| `laravel-versions/references/syntax-by-version.md` | **A syntax feature's availability is in question** — PHP 8.1–8.5, Inertia, Pest, Filament, Flux, Alpine |
| `laravel-versions/references/ecosystem-matrix.md` | You need a package's version, support band, or its official machine-readable docs surface |
| `laravel-blade-livewire/references/livewire-versions.md` | Writing Livewire on any version (2.x/3.x/4.x syntax and behaviour) |
| `laravel-daisyui/references/components-and-rules.md` | Writing daisyUI markup — 65 components, colour names, the vendor's 12 rules |
| `laravel-conventions/references/security-checklist.md` | Any change touching auth, authorization, input, uploads, or output |
| `laravel-design-decision/references/patterns.md` | Choosing structure — patterns, fit criteria, and overhead |
| `laravel-recon/references/failure-taxonomy.md` | You want to know *why* the verification loop exists, or are deciding what to verify |
| `laravel-route/references/routing-table.md` | This file — the routing decision itself |
