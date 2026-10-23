---
name: laravel-stack
description: Detect a Laravel app's framework version, front end, and full stack profile before planning changes.
---

# Determine the application stack first

Never plan Laravel work from assumptions. The stack (framework major, front end,
auth, data layer, tooling) changes which APIs exist, which files are canonical, and
which conventions are correct. Establish the profile, **record it**, then act.

## 0. Is there an application at all?

Before detecting anything, check whether there is a Laravel app to detect:

- No `artisan`, no `composer.json` requiring `laravel/framework` → **there is no stack to
  detect.** Invoke `laravel-stack-interview` and let the user choose the stack. Do not scaffold,
  and do not assume "latest everything".
- A `composer.json` with no framework constraint and no lock file → the version is genuinely
  undetermined. Same path.
- An app is present but a layer that changes code (rendering, component layer, CSS major) cannot
  be determined from its files → invoke `laravel-stack-interview` for **just those axes**. Do not
  fill the gap with a plausible default.

Detection answers *what is this app*. When the honest answer is "unknown", the correct action is to
ask, not to guess. An undetermined stack is a blocking gap, because every version-gated rule
downstream depends on it.

## 1. Collect evidence (do not guess)

Run these against the target application root. Prefer reading committed files over
asking; only ask the user when evidence is genuinely ambiguous.

| Question | Evidence to read, in priority order |
| --- | --- |
| Framework version | `composer.lock` → `packages[].name == laravel/framework` → `version` |
| Declared constraint | `composer.json` → `require."laravel/framework"` (e.g. `^12.0`) |
| PHP version | `composer.json` → `require.php`; then `php -v` if PHP is available |
| Front end | `package.json` → `dependencies` / `devDependencies` (see table below) |
| Server-driven UI | `composer.json` → `livewire/livewire`, `filament/filament`, `laravel/fortify` |
| SPA bridge | `composer.json` → `inertiajs/inertia-laravel`; `package.json` → `@inertiajs/*` |
| Auth mechanism | `composer.json` → `laravel/sanctum`, `laravel/passport`, `laravel/fortify`, `laravel/ui` |
| Routes present | existence of `routes/web.php`, `routes/api.php`, `routes/channels.php`, `routes/console.php` |
| Skeleton style | existence of `app/Http/Kernel.php` (classic) vs `bootstrap/app.php` fluent config (slim) |
| Config published | count of files in `config/` — a slim app ships very few |
| Database | `.env` → `DB_CONNECTION`; `config/database.php` → `default` |
| Queue / cache / session | `.env` → `QUEUE_CONNECTION`, `CACHE_STORE` (11+) or `CACHE_DRIVER` (≤10), `SESSION_DRIVER` |
| Testing | `composer.json` → `pestphp/pest` vs `phpunit/phpunit`; layout of `tests/` |
| Static analysis / style | `laravel/pint`, `larastan/larastan`, `phpstan/phpstan`, `driftingly/rector-laravel` |
| Local runtime | `docker-compose.yml`, `compose.yaml`, `laravel/sail`, `.ddev/`, `Lando` |
| Realtime / async | `laravel/reverb`, `laravel/horizon`, `laravel/octane`, `predis/predis` |
| CSS framework + major | `package.json` → `tailwindcss`; `tailwind.config.js` exists (v3) vs `@tailwindcss/vite` in devDeps (v4) |
| CSS entry directives | `resources/css/app.css` → `@import "tailwindcss"` (v4) vs `@tailwind utilities` (v3) |
| Component / UI layer | `package.json` → `daisyui`, `flowbite`, `@headlessui/*`; `composer.json` → `livewire/flux` |
| JS sprinkles | `package.json` → `alpinejs` and any `@alpinejs/*` plugins |
| Livewire extras | `composer.json` → `livewire/volt`, `livewire/flux` (and the Flux tier) |
| File-based routing | `composer.json` → `laravel/folio`; `resources/views/pages/` present |
| Typed client routes | `composer.json` → `laravel/wayfinder` |
| Feature flags | `composer.json` → `laravel/pennant` |
| Agent tooling (optional) | `composer.json` → `laravel/boost` — record presence only; this plugin never requires it |
| Containerised dev | `vendor/bin/sail`, `docker-compose.yml`, `compose.yaml`, `.ddev/`, `Lando` |
| Browser tests | `laravel/dusk`; `tests/Browser/` |
| Livewire component layer | `composer.json` → `robsontenorio/mary` (maryUI) |
| Native shell | `composer.json` → `nativephp/desktop`, `nativephp/mobile`, or the legacy `nativephp/electron` + `nativephp/laravel` — **never more than one product** |

Front end is decided by `package.json`, not by the presence of a directory:

| Dependency found | Stack |
| --- | --- |
| `@inertiajs/react` (+ `react`) | Inertia + React |
| `@inertiajs/vue3` (+ `vue`) | Inertia + Vue |
| `@inertiajs/svelte` (+ `svelte`) | Inertia + Svelte |
| `alpinejs` only, views are Blade | Blade + Alpine |
| `livewire/livewire` in composer | Livewire |
| `filament/filament` in composer | Filament panel (may coexist with either of the above) |
| No front-end deps, `routes/api.php` + Sanctum only | API-only |

A single app can be **Blade + Livewire + Filament** or **Inertia + API routes**.
Record every layer present; do not force a single label.

Then record the **CSS / component layer independently of the rendering layer** — these compose
freely, and each has its own version split that changes the code you write:

| Dependency found | Layer | Version split that matters |
| --- | --- | --- |
| `tailwindcss` in `package.json` | CSS utility framework | **4.x is CSS-first** (`@theme`, no JS config); 3.x uses `tailwind.config.js` |
| `daisyui` in `package.json` | Component layer | **5.x requires Tailwind 4**; 4.x targets Tailwind 3 |
| `flowbite` in `package.json` | Component layer | Tailwind 4 compatible in 4.x |
| `livewire/flux` in composer | Livewire component layer | Free vs Pro tiers; component set differs |
| `alpinejs` in `package.json` | JS interactivity | Note whether it is explicit or bundled by Livewire 3+ |
| `react` / `vue` / `svelte` | Client framework | Svelte 5 runes ≠ 4; React 19 ≠ 18 |
| `robsontenorio/mary` in composer | Livewire component layer (maryUI) | **2.x requires daisyUI 5 + Tailwind 4**; 1.x is the daisyUI 4 + Tailwind 3 era |

**Always record the major version, not just presence.** "Tailwind present" is not actionable;
"Tailwind 4 with daisyUI 5" is. A presence-only profile is the main cause of a wrong route.

Then record the **front-end stack number**. The combination of interactivity runtime, Tailwind
install mode, component layer, and navigation is what actually determines the code — and
"Livewire + Tailwind" describes at least eight distinct stacks. Read
`references/frontend-stacks.md` and write the number and composition, e.g.
`Stack 4: Livewire + Tailwind 4 + daisyUI 5 + maryUI 2`, or
`Stack 9: Livewire/maryUI public + Filament admin`.

## 2. Distinguish skeleton era

`app/Http/Kernel.php` present → classic skeleton (Laravel ≤10 style).
Absent, with fluent config in `bootstrap/app.php` → slim skeleton (Laravel 11+).

Both are valid on Laravel 11+. If the app is a classic skeleton running 11+, that is
**supported and expected**; do not "modernise" the structure without being asked.
See `laravel-versions` for what each era implies.

## 3. Record the profile

Write the result to `.dsh/laravel-stack.md` so later turns and other skills read
one canonical answer instead of re-deriving it:

```markdown
# Stack profile
- Laravel: 13.34.0 (constraint ^13.0) — supported
- PHP: 8.4 (constraint ^8.3)
- Skeleton: slim (bootstrap/app.php, bootstrap/providers.php, routes/console.php)
- Rendering: Inertia + React 19 (TS) | Blade present for mail/PDF
- Client bridge: inertiajs/inertia-laravel 3.4.0 + @inertiajs/react 3.7.1
- Livewire: 4.4.7 (Flux free, Volt not installed)
- Admin: Filament 5.9.0
- CSS: Tailwind 4.3.3 (CSS-first, @tailwindcss/vite) + daisyUI 5.7.47
- JS: Alpine 3.17.4 (bundled via Livewire)
- Routing: routes/web.php + Folio pages present | Typed routes: wayfinder 0.1.21
- Feature flags: none
- Auth: Fortify (+ 2FA)
- Data: PostgreSQL, migrations + factories present
- Queue: redis + Horizon | Cache: redis | Session: database
- Async/runtime: Reverb present, Octane absent
- Testing: PHPUnit ^12, tests/Feature + tests/Unit, no Dusk
- Tooling: Pint, Larastan level 6, Rector, no Pail
- Local runtime: Sail
- Agent tooling: laravel/boost absent (optional; not required)
- Verified: <date> from composer.lock / package.json
```

Record **absent** as well as present for the notable layers (Livewire, Filament, Octane, Dusk).
"Absent" is a routing signal too — it is what keeps the route narrow.

Only write facts you read. Mark anything unverified as `unknown` rather than filling it in.

## 4. Then route — always

**Do not pick skills by hand.** Invoke `laravel-route`, which consumes this profile and returns
the exact set of skills to load, each with the version gate that applies, plus the condensed
version knowledge for this app.

`laravel-stack` answers *what is this app*. `laravel-route` answers *what must the agent load
because of it*. Skipping the route is what produces generic Laravel advice applied to a
specific version.

For the full catalogue of modern stacks and their decision criteria — including which to
recommend for new work — read `references/stack-catalog.md`.

And when you are about to write code against any detected package, read
`references/package-syntax-map.md`: it maps each package to the correct **prefix, namespace, and
registration** for the installed major. Prefixes are facts about the installed package, not idioms —
a plausible-looking one fails at runtime exactly like a plausible-looking column name.

## Hard rules

- A version-specific API is never assumed. If the profile says Laravel 11, do not use
  PHP-attribute `#[Table]` / `#[Fillable]` model configuration, which is 13+ only.
- **If there is no application, or the stack is undetectable, invoke `laravel-stack-interview`
  before anything else.** Never default to "latest", and never scaffold on an assumed stack.
- If `composer.lock` and `composer.json` disagree, `composer.lock` is what actually
  runs; note the drift explicitly.
- If the app is a Laravel package (no `artisan`), still record the framework version
  its `composer.json` requires, since that bounds which APIs are legal.
