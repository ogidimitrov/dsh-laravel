# What's new — teaching the model past its knowledge cutoff

A model's training has a cutoff. Laravel ships a major roughly every year, and the surrounding
ecosystem moves faster still, so an agent will frequently be working on a version it has never
seen. It will then do the worst possible thing: **write plausible code from stale priors.**

This file exists to fix that. It carries what each current major actually introduced, so the agent
teaches itself rather than guessing — and it states where to fetch anything not recorded here.

Verified **2026-09-29** from official sources (each section names its source).

## How to use this file

1. Read the installed versions from `composer.lock` / `package-lock.json`.
2. Compare against the sections below. **If the installed version is newer than what you know, this
   file and the fetch URLs below are authoritative — your recall is not.**
3. For anything not covered, fetch the **version-scoped** source (see the table at the end). Never
   fill a gap from memory.

## Fetchable version-scoped documentation

This is the mechanism that removes the cutoff dependency: **request the exact version's exact
page, as markdown.** No search, no guessing, no stale cache.

| Ecosystem | Version-scoped source | Verified |
| --- | --- | --- |
| **Laravel framework** | `https://laravel.com/framework/docs/{x}.x/{page}.md` | 13.x and 12.x `queries.md` both 200, and they differ in content — so the version is honoured |
| **Laravel upgrade guide** | `https://raw.githubusercontent.com/laravel/docs/{x}.x/upgrade.md` | used throughout this repo |
| **Laravel release notes** | `https://raw.githubusercontent.com/laravel/docs/{x}.x/releases.md` | used below |
| **Laravel directory structure** | `https://raw.githubusercontent.com/laravel/docs/{x}.x/structure.md` | |
| **Filament** | `https://filamentphp.com/docs/{x}.x/{path}.md` | 5.x `introduction/overview.md` 200 |
| **Filament index** | `https://filamentphp.com/docs/llms.txt` | versioned index of every page, incl. `5.x/introduction/ai.md` |
| **Pest** | `https://pestphp.com/llms.txt` · `https://pestphp.com/llms-full.txt` | index + the **entire docs in one file**; per-page `/docs/{page}/llms.txt` |
| **Flux UI** | `https://fluxui.dev/docs/{page}.md` (index: `https://fluxui.dev/llms.txt`) | upgrade guide at `docs/upgrading.md` |
| **Context7** (fallback, third-party) | `https://context7.com/{org}/{repo}/llms.txt` | **Not `llms.txt` format**; version selection is by API `topic`, not path. Use only when no upstream surface exists |
| **Livewire** | `https://livewire.laravel.com/docs/{x}.x/{page}` | `/docs/upgrading` resolved into `/docs/4.x/upgrading` |
| **daisyUI** | `https://daisyui.com/llms.txt` | self-declares `version: 5.7.x` |
| **Tailwind CSS** | `https://tailwindcss.com/docs` (v4) · `https://v3.tailwindcss.com` (v3) | **no `llms.txt`** — deliberate upstream decision |
| **Livewire / Inertia** | no official `llms.txt` | use the versioned prose docs above |

Substitute the **installed** major for `{x}`. Fetching the wrong major's page is how a version
error gets a citation attached to it.

## Laravel 13 — current

*Source: `laravel/docs` 13.x `releases.md`.*

Framing: AI-native workflows, stronger defaults, expressive APIs. **Minimal breaking changes** —
most apps upgrade without touching application code. Requires **PHP 8.3**.

- **Laravel AI SDK** — first-party, provider-agnostic API for text generation, tool-calling agents,
  embeddings, audio, images, and vector stores.
  ```php
  $response = SalesCoach::make()->prompt('Analyze this sales transcript...');
  $image = Image::of('A donut sitting on the kitchen counter')->generate();
  $audio = Audio::of('I love coding with Laravel.')->generate();
  $embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
  ```
- **JSON:API Resources** — first-party, spec-compliant: resource objects, relationship inclusion,
  sparse fieldsets, links, and compliant response headers.
- **`PreventRequestForgery`** — the request-forgery middleware, enhanced and formalized with
  **origin-aware verification**, while remaining compatible with token-based CSRF.
- **Queue routing by class** — central routing rules:
  ```php
  Queue::route(ProcessPodcast::class, connection: 'redis', queue: 'podcasts');
  ```
- **Expanded PHP attributes** — controller `#[Middleware]` and `#[Authorize]`; job `#[Tries]`,
  `#[Backoff]`, `#[Timeout]`, `#[FailOnTimeout]`; plus attributes across Eloquent, events,
  notifications, validation, testing, and resource serialization.
- **`Cache::touch(...)`** — extend an existing cache item's TTL without retrieving and re-storing.
- **Semantic / vector search** — native vector queries; PostgreSQL + `pgvector`:
  ```php
  DB::table('documents')->whereVectorSimilarTo('embedding', 'Best wineries in Napa Valley')->limit(10)->get();
  ```
- Plus: typed Eloquent properties, Reverb database driver, passkeys, Symfony 7.4/8.0 support.

## Laravel 12 — security-fixes only

*Source: `laravel/docs` 12.x `releases.md`.*

A deliberate **maintenance release**: dependencies updated, minimal breaking changes, no application
code changes required for most apps.

- **New starter kits** for React, Svelte, Vue, and Livewire:
  - React / Svelte / Vue → **Inertia 2** + TypeScript + shadcn/ui + Tailwind
  - Livewire → **Flux UI** + **Laravel Volt**
  - A **WorkOS AuthKit** variant of each adds social authentication, passkeys, and SSO.
- **Breeze and Jetstream no longer receive updates.** Do not reach for either on a 12+ project.
- From the upgrade guide: UUIDv7 model keys by default, image validation excludes SVG, nested array
  request merging changed, Carbon 3.

## Laravel 11

Slim skeleton (see `version-deltas.md` for the full breaking list): `bootstrap/app.php`,
`bootstrap/providers.php`, `routes/console.php`; config published on demand; `install:api` and
`install:broadcasting` opt-in; `casts()` method; Carbon 3; Doctrine DBAL removed; automatic
password rehashing; per-second rate limiting; modern SQLite requirement.

## Livewire 4 — current

*Source: `livewire/livewire` `docs/upgrading.md`.*

- **Single-file and multi-file components.** SFC puts PHP and Blade in one file; MFC organizes
  PHP, Blade, JavaScript, and tests in a directory. View-based component files are prefixed with
  **⚡** by default (disable via `make_command.emoji`).
  ```bash
  php artisan make:livewire create-post        # single-file (default)
  php artisan make:livewire create-post --mfc  # multi-file
  php artisan livewire:convert create-post     # convert between formats
  ```
- **Slots and attribute forwarding** — `{{ $attributes }}` for composed components.
- **JavaScript in view-based components** — a plain `<script>` tag, no `@script` wrapper, served as
  a separate cached file with `$wire` automatically bound as `this`:
  ```blade
  <script>
      this.count++      // same as $wire.count++
      $wire.save()
  </script>
  ```
- **Islands** — isolated regions that update independently, without separate child components:
  ```blade
  @island(name: 'stats', lazy: true)
      <div>{{ $this->expensiveStats }}</div>
  @endisland
  ```
- Plus the breaking set: `Route::livewire()` for full-page components, `smart_wire_keys` defaulting
  to `true`, `csp_safe` mode, `component_namespaces`/`component_locations`, and **Volt absorbed into
  core**. Details in `laravel-blade-livewire/references/livewire-versions.md`.

## Livewire 3

`#[Computed]` methods, Form objects, `dispatch()`/`#[On]`, `wire:navigate`, automatic style/script
injection, bundled Alpine, `$this->js()`. The 2 → 3 → 4 comparison table lives in
`laravel-blade-livewire/references/livewire-versions.md`.

## Tailwind CSS 4

A configuration rewrite, not an increment (detail in `laravel-tailwind`): CSS-first `@theme`,
`@import "tailwindcss"`, `@plugin`, `@source`, `@utility`, `@custom-variant`; the
`@tailwindcss/vite` plugin; automatic content detection; a modern-browser baseline (cascade layers,
`@property`, `color-mix()`); renamed utilities plus changed border and ring defaults.

## daisyUI 5

Requires **Tailwind 4** (daisyUI 4 targets Tailwind 3). Smoothed `base-100`/`base-200`/`base-300`
colour handling, so existing background overrides are often redundant. Ships the official
`llms.txt` (below).

## maryUI 2

Requires **daisyUI 5 + Tailwind 4** (maryUI 1 is the daisyUI 4 + Tailwind 3 era). Visual redesign
following daisyUI 5, internal class rearrangements, and per-minor prop changes. The 1.x → 2.x
migration is a build-system change — see `laravel-maryui`.

## NativePHP 4 (and 3)

- **v4 — SuperNative.** `native:` Blade components compile to real SwiftUI / Jetpack Compose views;
  PHP writes into shared memory instead of serializing across a bridge; screens are
  `NativeComponent` classes registered with `Route::native()`. Some previously standalone plugins
  became core, so those packages now **conflict**; the Vite dev server is opt-in (`--vite`).
- **v3 — plugin architecture.** Core APIs became plugins requiring `NativeServiceProvider`
  registration; MIT-licensed. **v3.1** added the persistent runtime (Laravel boots once), background
  queue workers, Android 8+, and `intl` on iOS (which is what makes Filament work on-device).

Details and the lifecycle constraint: `laravel-nativephp`.

## Filament 5

Docs are served per-page as markdown and indexed at `https://filamentphp.com/docs/llms.txt`
(verified, includes a dedicated `5.x/introduction/ai.md` and a version-support-policy page). Fetch
`https://filamentphp.com/docs/5.x/{path}.md` for the installed major. Do not carry Filament syntax
across majors — namespaces and schema APIs moved between 2 → 3 → 4 → 5.

## Pest and PHPUnit

Pest 5 is current (`pestphp/pest` 5.2.1, PHP `^8.4`); the Laravel 13 skeleton pins
`phpunit/phpunit ^12.5.12` and the 12 skeleton pins `^11.5.3`. The newest standalone PHPUnit
release is not what a Laravel skeleton installs — read `composer.lock`. Consult the runner's own
release notes for feature specifics rather than assuming.

## Maintenance contract

Every section above is dated. When a Laravel or library major ships:

1. Re-fetch that project's release notes for the new major (URLs in the table above).
2. Add the new major's section here; move the previous one down.
3. Update `ecosystem-matrix.md` version numbers.
4. Update the affected stack skill if its version split moved.

A stale "what's new" section is worse than none, because it teaches the wrong version with
confidence.
