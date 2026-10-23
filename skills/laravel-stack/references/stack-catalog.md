# Modern Laravel stack catalogue

Decision criteria for every currently viable Laravel stack. Use this to *identify* a
stack you found, and to *recommend* one when starting greenfield work. Pair it with the
version matrix in `laravel-versions` — not every stack is available on every major.

## 1. Rendering / front-end axis

### Blade + Alpine (server-rendered, minimal JS)
- **Signals:** `resources/views/**/*.blade.php`, `alpinejs` in `package.json`, no Inertia/Livewire.
- **Choose when:** content-heavy or form-centric sites, small teams, SEO-first, minimal interactivity.
- **Strengths:** lowest conceptual overhead; progressive enhancement; trivial caching.
- **Watch for:** interactivity pushed into inline `<script>`; duplicated validation between
  Blade and controllers. Move validation into Form Requests, not into views.

### Livewire (+ Flux UI)
- **Signals:** `livewire/livewire` in composer; `app/Livewire/`; `wire:model` in views.
  Flux UI (`livewire/flux`) indicates the official starter-kit styling.
- **Choose when:** rich interactivity with a PHP-only team; dashboards, CRUD, wizards.
- **Strengths:** no separate API or JS state layer; server owns state.
- **Watch for:** per-request round trips on every field; N+1 inside `render()`; heavy
  public properties leaking state; missing `#[Locked]` on identity-bearing properties.
  Keep queries out of `render()` and into computed properties / dedicated actions.

### Inertia SPA — React, Vue, or Svelte
- **Signals:** `inertiajs/inertia-laravel` (composer) **and** `@inertiajs/react|vue3|svelte`
  (package.json); `resources/js/pages`; `resources/js/app.tsx|.vue|.svelte`.
- **Choose when:** app-like UX, a JS-proficient team, shared rich client state, large SPA surface.
- **Strengths:** full client-side routing/state without hand-writing a REST API.
- **Watch for:** controllers returning view data shaped for a page component (props are a
  contract — type them); duplicated validation client- and server-side; over-fetching props
  on every visit. Use lazy/`optional` props and partial reloads.
- **Variant note:** the official starter kits use TypeScript and shadcn-style components.
  Never assume plain JS or a specific component library — read `resources/js`.

### API-only (headless backend)
- **Signals:** `routes/api.php` present, `laravel/sanctum` or `laravel/passport`, no
  `resources/views` app UI, front end in a separate repository or an SPA served elsewhere.
- **Choose when:** multiple clients (web, mobile, partner), or an existing external front end.
- **Strengths:** hard boundary; independently deployable clients; easy to test.
- **Watch for:** leaking Eloquent models directly as responses; unversioned breaking changes;
  missing resource classes. Always use API Resources and explicit status codes.

### Filament (admin panel)
- **Signals:** `filament/filament` in composer; `app/Filament/**`; `AdminPanelProvider`.
- **Choose when:** the product is substantially internal back-office CRUD on top of Eloquent.
- **Strengths:** fastest path to a real admin; policies, tables, forms, actions for free.
- **Watch for:** business logic written in Resources/Pages instead of domain actions;
  authorization done in the UI rather than policies; using Filament as the public site.
- **Coexistence:** Filament sits *alongside* Livewire, Inertia, or Blade. It is a layer, not a stack.

### Nova (commercial admin) / other admin panels
- **Signals:** `laravel/nova` in composer.
- **Note:** commercial licence; treat like Filament for "keep logic out of the admin layer".

### Volt (single-file Livewire)
- **Signals:** `livewire/volt` in composer; `<?php` + `@volt` in a component Blade file.
- **Choose when:** many small, self-contained Livewire components and the team prefers
  co-located PHP + template.
- **Watch for:** Volt being **absorbed into Livewire 4** — on Livewire 4 do not add or keep the
  package. See `laravel-volt`.

## 1b. CSS / component layer axis

Independent of the rendering layer — every combination below is legitimate, and each pairing has
a version constraint that changes the code.

| Layer | Choose when | Hard constraint |
| --- | --- | --- |
| **Tailwind 4** (CSS-first) | New projects; Laravel 12+ starter kits | `@theme`/`@import`, no `tailwind.config.js`. v3 syntax silently produces unstyled output |
| **Tailwind 3** (JS config) | Existing Laravel 10/11 apps | `tailwind.config.js` + PostCSS pipeline |
| **daisyUI 5** | Want ready-made, themeable components on Tailwind 4 | **Requires Tailwind 4** |
| **daisyUI 4** | Existing Tailwind 3 apps | Requires Tailwind 3 |
| **maryUI 2** | Blade/Livewire components on top of daisyUI — tables, forms, modals, menus, charts | **Requires daisyUI 5 + Tailwind 4.** Needs the `@source` line for its component PHP files |
| **maryUI 1** | Legacy equivalent for older apps | daisyUI 4 + Tailwind 3 era; v1 docs are deprecated |
| **Flux UI** (free/Pro) | Official Livewire component library; starter-kit parity | Requires Livewire; component set differs by tier |
| **Flowbite** | Tailwind-native components without Livewire coupling | Check the Tailwind major compatibility |
| **Hand-rolled + Alpine** | Small surface, full control | You own accessibility and consistency |

Rules:
- **Never mix two component libraries** in the same markup. Pick one layer per surface.
- **daisyUI is not Tailwind.** It is a component layer on top; `laravel-tailwind` still governs
  the utility/config layer and its major.
- **Flux and Filament are different surfaces.** Flux for the app UI, Filament components inside
  panels. Do not blend them.
- **Record the major version, not just presence.** "daisyUI present" cannot be routed; "daisyUI 5
  on Tailwind 4" can.

**For the complete set of Tailwind and Livewire compositions — including the named canonical
stacks and which combinations are incoherent — see `frontend-stacks.md`.** This section lists the
layers; that file lists the actual stacks.

### Alpine
- **Signals:** `alpinejs` in `package.json`; `x-data` in views.
- **Note:** Livewire 3+ **bundles** Alpine. An explicit `alpinejs` dependency alongside Livewire
  may mean two copies on the page.
- **Choose when:** local presentational interactivity only. Server-relevant state belongs in
  Livewire. See `laravel-alpine`.

## 1c. Routing, typed routes, and feature flags

| Concern | Signal | Note |
| --- | --- | --- |
| File-based routing | `laravel/folio`; `resources/views/pages/` | Coexists with `routes/web.php` — check both before adding a route |
| Typed client routes | `laravel/wayfinder` | Generates typed route/controller helpers; use them instead of hand-written URLs |
| Feature flags | `laravel/pennant` | Rollout mechanics. **Never** an authorization control |
| Browser tests | `laravel/dusk` | Slow; use only for genuinely browser-bound behaviour |

## 2. Authentication axis

| Mechanism | Signal | Use for |
| --- | --- | --- |
| Fortify | `laravel/fortify` | Headless auth backend: SPA cookie or API, 2FA, passkeys |
| Breeze | `laravel/breeze` | **Retired in 12.x** — legacy apps only; prefer starter kits |
| Jetstream | `laravel/jetstream` | **Retired** — legacy apps only; superseded by starter kits |
| Sanctum | `laravel/sanctum` | First-party SPA tokens + simple API tokens |
| Passport | `laravel/passport` | Full OAuth2 server for third-party clients |
| WorkOS AuthKit | `workos/*` | Social login, SSO, enterprise directory sync |
| Panel auth | Filament/Nova config | Admin-only surfaces — still back it with policies |

Sanctum is the correct default for first-party SPA and mobile. Passport only when you
genuinely need OAuth2 grants for external consumers.

## 3. Data axis

| Store | When it is the right call |
| --- | --- |
| SQLite | Local/dev, tests, small single-node apps, edge deploys. Laravel 11+ requires a modern SQLite |
| MySQL / MariaDB | Ubiquitous hosting, read replicas, familiar ops |
| PostgreSQL | JSONB, full-text/vector search (`pgvector`), strong constraints, complex queries |
| SQL Server | Enterprise integration, existing Microsoft estate |

Always confirm the actual default in `config/database.php` before writing
driver-specific SQL or migrations. Never write raw SQL that assumes MySQL when the
profile says PostgreSQL.

## 4. Async / runtime axis

| Layer | Signal | Notes |
| --- | --- | --- |
| Queue | `QUEUE_CONNECTION` | `sync` in production is a bug; flag it |
| Horizon | `laravel/horizon` | Redis-only queue supervision + dashboards |
| Reverb | `laravel/reverb` | First-party WebSockets; replaces third-party Pusher for many apps |
| Octane | `laravel/octane` | Long-lived workers — **no** request-state leakage; singleton pitfalls |
| Scheduler | `routes/console.php` (11+) or `app/Console/Kernel.php` (≤10) | Location depends on skeleton era |

Any Octane app needs extra scrutiny: static/singleton state, `once()` misuse, and
container bindings that assumed per-request lifecycles are the classic Octane bugs.

## 5. Quality axis

| Concern | Tool | Signal |
| --- | --- | --- |
| Test runner | Pest | `pestphp/pest` in composer |
| Test runner | PHPUnit | `phpunit/phpunit`, `phpunit.xml` |
| Browser tests | Dusk | `laravel/dusk` |
| Style | Pint | `laravel/pint`, `pint.json` |
| Static analysis | Larastan / PHPStan | `larastan/larastan`, `phpstan.neon` |
| Automated upgrades | Rector | `driftingly/rector-laravel`, `rector.php` |
| Type coverage | Pest type coverage | `pest --type-coverage` |

Match the app's existing runner. Writing PHPUnit tests into a Pest project (or vice
versa) is a regression in consistency, not a neutral choice.

## 6. Recommended greenfield default

As of the verified matrix in `laravel-versions`:

- **Framework:** latest 13.x. Only the newest major receives bug fixes.
- **PHP:** 8.3+ (8.4/8.5 where the host allows).
- **Rendering:** pick exactly one primary — Livewire for PHP-centric teams, Inertia
  (React/Vue/Svelte) for JS-centric teams. Add Filament only if there is a real admin surface.
- **Auth:** Fortify on top of a starter kit; Sanctum for API surfaces.
- **Data:** PostgreSQL unless the host or team mandates otherwise.
- **Queue/cache:** Redis in production; never `sync` in production.
- **Quality:** Pest + Pint + Larastan from day one — retrofitting them is far more expensive.

Record deviations from this default in the stack profile; they are legitimate, but they
must be deliberate and visible.
