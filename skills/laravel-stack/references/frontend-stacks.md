# Tailwind and Livewire stack combinations

Every realistic Tailwind / Livewire composition for a Laravel app, and which combinations are
coherent. Use this when the profile's rendering layer, CSS layer, and component layer need to be
combined into an actual stack.

Versions verified 2026-09-29. See `laravel-versions/references/ecosystem-matrix.md` for the raw
package numbers.

## The composition model

A front-end "stack" is not one choice — it is a combination of four **independent axes**. Two
apps can both say "Livewire + Tailwind" and share almost no code.

| Axis | Options |
| --- | --- |
| **Interactivity runtime** | None (plain Blade) · Livewire (class components) · Livewire SFC · Volt · Inertia (React/Vue/Svelte) · none + API |
| **Utility CSS** | Tailwind 4 (CSS-first) · Tailwind 3 (JS config) · no Tailwind |
| **Component layer** | None · daisyUI · Flux · maryUI · Filament · Flowbite · Tailwind Plus |
| **Build / navigation** | Vite · `wire:navigate` · Folio · Wayfinder · NativePHP shell |

Route each axis, not just "the front end". A presence-only profile cannot distinguish stack #4
from stack #8 below.

## Axis A — Tailwind installation modes

| Mode | Signals | Notes |
| --- | --- | --- |
| **Tailwind 4 + `@tailwindcss/vite`** | `@tailwindcss/vite` in devDeps | The Laravel 12+ default. CSS-first: `@theme`, no JS config |
| **Tailwind 4 + `@tailwindcss/postcss`** | `@tailwindcss/postcss` + `postcss.config.js` | Same CSS-first model, PostCSS pipeline |
| **Tailwind 3 + PostCSS** | `tailwind.config.js` + `postcss.config.js` | Laravel 10/11 era. `@tailwind base/components/utilities` |
| **Tailwind standalone CLI** | a `tailwindcss` binary step, no `package.json` pipeline | No Node toolchain; watch the source-path config carefully |
| **Tailwind CDN / play script** | `<script src="…tailwindcss…">` in a layout | **Development only.** Never ship this to production |

Tailwind's config model is the version boundary that matters — see `laravel-tailwind`. The
install mode is almost always correlated with the Laravel major (12+ ⇒ Tailwind 4), but verify
rather than infer, since upgraded apps often lag.

## Axis B — Livewire rendering modes

| Mode | Signals | Notes |
| --- | --- | --- |
| **Class component** (default) | `app/Livewire/**/*.php` | Livewire 2/3/4 baseline |
| **Full-page component** | `Route::get(..., Component::class)` (≤3) / `Route::livewire(...)` (4) | Routing form changed in 4 |
| **Single-file component (SFC)** | `make_command.type = 'sfc'` (4 default) | Livewire 4 default for `make:livewire` |
| **Volt component** | `livewire/volt` (Livewire 3) | **Absorbed into Livewire 4** — see `laravel-volt` |
| **Islands** | Livewire 4 feature | Partial updates of islands of a page |
| **Nested / inline component** | `<livewire:foo>` usage | `wire:key` discipline still applies |

## Axis C — Component layers

| Layer | Requires | Design system | Version chain |
| --- | --- | --- | --- |
| **None** (raw Tailwind utilities) | — | Your own | — |
| **daisyUI** | Tailwind | daisyUI semantic colours + themes | daisyUI 5 → Tailwind 4; daisyUI 4 → Tailwind 3 |
| **Flux** | Livewire | Flux's own | Flux 2.x; free vs Pro tiers |
| **maryUI** | Livewire (for interactive parts) | daisyUI's | maryUI 2 → daisyUI 5 → Tailwind 4; maryUI 1 → daisyUI 4 → Tailwind 3 |
| **Filament** | Livewire | Filament's own | Filament 5.x; panel-scoped |
| **Flowbite** | Tailwind | Flowbite's | Check the Tailwind major |
| **Blade UI Kit** | Blade | none (inputs/icons) | Usually paired, not a full layer — maryUI depends on `blade-ui-kit/blade-heroicons` |

## Axis D — Build and navigation

| Option | Signal | Effect |
| --- | --- | --- |
| Vite | `vite.config.js` | Standard asset pipeline |
| Livewire SPA nav | `wire:navigate` | Client-side navigation between Livewire pages |
| Folio | `laravel/folio` | File-based routing; coexists with route files |
| Wayfinder | `laravel/wayfinder` | Generated typed route helpers for the client |
| NativePHP shell | `nativephp/desktop` / `nativephp/mobile` | App runs inside a native shell — see `laravel-nativephp` |
| Vite dev server opt-in | `native --vite` | Livewire 4 / NativePHP mobile v4: dev server is opt-in |

## The canonical named stacks

| # | Stack | Composition | Version chain that must hold |
| --- | --- | --- | --- |
| 1 | **Plain Blade + Alpine** | Blade · Tailwind · Alpine · no Livewire | Alpine bundled? No — explicit `alpinejs` |
| 2 | **Livewire bare** | Livewire · Tailwind · no component layer | Livewire 2/3/4 |
| 3 | **Livewire + daisyUI** | Livewire · Tailwind · daisyUI | daisyUI 5 ⇒ Tailwind 4; daisyUI 4 ⇒ Tailwind 3 |
| 4 | **Livewire + daisyUI + maryUI** | Livewire · Tailwind · daisyUI · maryUI | maryUI 2 ⇒ daisyUI 5 ⇒ Tailwind 4 · Livewire 3/4 |
| 5 | **Livewire + Flux (free)** | Livewire · Tailwind · Flux free | Flux 2.x free tier components only |
| 6 | **Livewire + Flux Pro** | Livewire · Tailwind · Flux Pro | Flux 2.x Pro licence + tier component set |
| 7 | **Livewire + Volt** | Livewire 3 · Tailwind · Volt SFC | Volt is a package on 3, absorbed on 4 |
| 8 | **Livewire 4 SFC + Islands** | Livewire 4 · Tailwind · SFC default | Livewire 4 only (`make_command.type = 'sfc'`) |
| 9 | **Livewire public site + Filament admin** | Livewire · Tailwind · (daisyUI/maryUI/Flux) for public · Filament for panels | Both component layers, **different surfaces** |
| 10 | **Filament-first app** | Livewire · Tailwind · Filament only | Panel is the whole UI; not public-facing |
| 11 | **Legacy Livewire 1 stack** | Livewire 3 · Tailwind 3 · daisyUI 4 · maryUI 1 | The pre-Laravel-12 defaults |
| 12 | **Livewire + NativePHP desktop** | Livewire · Tailwind · optional daisyUI/maryUI/Flux · NativePHP desktop 2 | See `laravel-nativephp` |
| 13 | **Livewire + NativePHP mobile** | Livewire (web view) **or** SuperNative native components · NativePHP mobile 3/4 | Mobile v3 = web view; v4 = native UI by default |

## Composition rules

### Chains are constraints, not preferences

`maryUI 2 → daisyUI 5 → Tailwind 4` and `daisyUI 5 → Tailwind 4 only` are hard constraints. A
violation does not throw — it renders unstyled or subtly wrong, which is far more expensive to
diagnose. When the profile shows an inconsistent chain, report it before writing markup.

### One component layer per surface

Valid: daisyUI + maryUI (maryUI is *built on* daisyUI — that is one layer stack, not two).
Invalid: daisyUI alongside Flux, or maryUI alongside Filament, **in the same markup**. Conflicting
design tokens, spacing scales, and focus states.

Filament is the exception that proves the rule: it is a **separate surface**. A Livewire public
site using maryUI plus a Filament admin panel is stack #9 and is entirely normal — just don't
blend the two component vocabularies inside one view.

### Livewire and Inertia are alternatives per page

They can coexist in one application (e.g. an Inertia customer app and a Livewire admin), but a
single page should not be both. If the profile shows both, segment by route prefix and treat them
as two stacks. Loading `laravel-inertia` and `laravel-blade-livewire` together is correct when the
app genuinely has both surfaces — the route tells you which one applies.

### Alpine is usually already there

Livewire 3+ bundles Alpine. An explicit `alpinejs` dependency *alongside* Livewire may mean two
copies load. Check before adding Alpine-specific advice, and never use Alpine to hold state the
server owns (`laravel-alpine`).

### NativePHP changes the runtime, not just the packaging

NativePHP mobile v3+ uses a **persistent runtime** where one request stays open for the life of a
screen. That is an Octane-class constraint on state, not a packaging detail. SuperNative (mobile
v4) replaces the web view with real SwiftUI/Compose components via `native:` Blade components —
at which point the Livewire/Blade DOM model no longer describes the UI at all.

## Choosing for new work

| If the team is… | Prefer |
| --- | --- |
| PHP-centric, wants official parity | Livewire + Flux (stack 5) |
| PHP-centric, wants maximal component choice and free tooling | Livewire + daisyUI + maryUI (stack 4) |
| Wants an admin-heavy product | Filament-first (stack 10), Livewire public site if needed (stack 9) |
| JS-centric, app-like UX | Inertia React/Vue/Svelte (not a Livewire stack) |
| Building a desktop or mobile app | NativePHP desktop 2 / mobile 4 + a Livewire or SuperNative UI |
| Small and wants minimal dependencies | Plain Blade + Alpine (stack 1) |

Record the chosen stack by number in the profile. "Stack 4" is unambiguous; "Livewire + Tailwind"
is not.
