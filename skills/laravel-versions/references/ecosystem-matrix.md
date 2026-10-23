# Ecosystem version matrix

Every version this plugin reasons about, verified against **Packagist** (PHP) and the
**npm registry** (JS) on **2026-09-29**. This is the fact base for `laravel-versions`,
`laravel-stack`, and the router.

Patch/minor numbers drift weekly. The **major boundaries** — which is what changes code —
move about once a year and are the durable part. Re-verify before relying on a patch number.

## Laravel framework

| Major | Latest | PHP required | Symfony console | Support |
| --- | --- | --- | --- | --- |
| **13** | 13.34.0 | `^8.3` | `^7.4 \|\| ^8.0` | Current |
| 12 | 12.69.3 | `^8.2` | `^7.2` | Security fixes only |
| 11 | 11.57.0 | `^8.2` | `^7.0.3` | EOL |
| 10 | 10.50.3 | `^8.1` | `^6.2` | EOL |

Policy for every release: 18 months of bug fixes, 2 years of security fixes. **No LTS since
Laravel 6.**

### Application skeletons (`laravel/laravel`)

| Skeleton | PHP | `laravel/framework` | Test runner pinned | Note |
| --- | --- | --- | --- | --- |
| 13.10.1 | `^8.3` | `^13.17` | `phpunit/phpunit ^12.5.12` | adds `laravel/pail` |
| 12.0.0 | `^8.2` | `^12.0` | `phpunit/phpunit ^11.5.3` | ships `laravel/sail` |

The skeleton's pin is what a real app runs, even though `phpunit/phpunit` itself has
released 13.x. **Do not assume the newest standalone tool major is what Laravel pins.**

## Server-driven UI

| Package | Latest | PHP | Major-boundary meaning |
| --- | --- | --- | --- |
| `livewire/livewire` | 4.4.7 | `^8.1` | 2 → 3 → 4 change binding, computed values, and form APIs. See `laravel-blade-livewire/references/livewire-versions.md` |
| `livewire/flux` | 2.20.1 | `^8.1` | Free vs Pro tiers differ; component API moves between majors |
| `livewire/volt` | 1.11.2 | `^8.1` | Single-file Livewire components (Volt function API) |
| `laravel/folio` | 1.2.0 | `^8.1` | File-based routing; replaces route files for those pages |
| `laravel/wayfinder` | 0.1.21 | `^8.2` | Generates typed TS/JS route + controller helpers for the client |

## SPA / Inertia

| Package | Latest | Note |
| --- | --- | --- |
| `inertiajs/inertia-laravel` | 3.4.0 | Server adapter |
| `@inertiajs/react` | 3.7.1 | Client adapter — **match the adapter to the framework** |
| `@inertiajs/vue3` | 3.7.1 | |
| `@inertiajs/svelte` | 3.7.1 | |
| `react` | 19.3.0 | |
| `vue` | 3.5.43 | |
| `svelte` | 5.57.1 | Svelte 5 runes differ substantially from 4 |

Inertia's own version is independent of the client framework's major. Check both.

## Admin panels

| Package | Latest | PHP | Note |
| --- | --- | --- | --- |
| `filament/filament` | 5.9.0 | `^8.2` | Namespaces and schema APIs moved across 2 → 3 → 4 → 5 |
| `laravel/nova` | (commercial) | — | Licence required; not covered by this plugin's guidance |

## CSS / JS toolchain

| Package | Latest | Major-boundary meaning |
| --- | --- | --- |
| `tailwindcss` | 4.3.3 | **4 is a rewrite**: CSS-first `@theme` config, no `tailwind.config.js` by default. See `laravel-tailwind` |
| `@tailwindcss/vite` | 4.3.3 | The v4 Vite integration (replaces the PostCSS pipeline) |
| `daisyui` | 5.7.47 | **5 requires Tailwind 4**; 4.x targets Tailwind 3. See `laravel-daisyui` |
| `robsontenorio/mary` | 2.9.10 | maryUI component layer. **2.x ⇒ daisyUI 5 + Tailwind 4**; 1.x (1.41.8) ⇒ daisyUI 4 + Tailwind 3. Supports Laravel 10–13. See `laravel-maryui` |
| `alpinejs` | 3.17.4 | Alpine 3 is current; plugins are separate packages |
| `vite` | 8.3.1 | |
| `laravel-vite-plugin` | 3.2.0 | Must be compatible with the installed Vite major |
| `typescript` | 7.0.2 | |

## Auth

| Package | Latest | PHP | Use |
| --- | --- | --- | --- |
| `laravel/fortify` | 1.40.0 | `^8.2` | Headless auth backend |
| `laravel/sanctum` | 4.3.3 | `^8.2` | First-party SPA + API tokens |
| `laravel/passport` | 13.8.0 | `^8.2` | Full OAuth2 server |
| `laravel/breeze` | 2.4.2 | `^8.2` | **Superseded** by starter kits from 12; legacy only |
| `laravel/jetstream` | 5.5.3 | `^8.2` | **Superseded**; legacy only |

## Infrastructure

| Package | Latest | PHP |
| --- | --- | --- |
| `laravel/horizon` | 5.50.0 | `^8.0` |
| `laravel/octane` | 2.20.0 | `^8.1` |
| `laravel/reverb` | 1.12.0 | `^8.2` |
| `laravel/sail` | 1.68.0 | `^8.0` |

## Quality

| Package | Latest | PHP | Note |
| --- | --- | --- | --- |
| `pestphp/pest` | 5.2.1 | `^8.4` | Pest majors move fast; match the project, not the latest |
| `phpunit/phpunit` | 13.3.6 | `>=8.4.1` | Standalone latest — Laravel 13 skeletons pin `^12`, 12 pin `^11` |
| `laravel/pint` | 1.32.1 | `^8.3` | |
| `larastan/larastan` | 3.12.2 | `^8.2` | PHPStan levels matter more than the version |
| `driftingly/rector-laravel` | 2.6.2 | `>=8.3` | Automated upgrades |
| `laravel/dusk` | 8.7.0 | `^8.1` | Browser tests |

## Agent tooling (optional — this plugin never requires it)

`laravel/boost` 2.10.0 (PHP `^8.2`) is Laravel's official agent package: an MCP server
(`php artisan boost:mcp`), version-aware AI guidelines, and Agent Skills in the same
`SKILL.md` layout DSH uses. This plugin is **self-contained and does not depend on
Boost**; if a project already has it, its guidelines are a legitimate additional source and
the stack profile should record that it is present.

## Native applications

| Package | Latest | PHP | Laravel | Notes |
| --- | --- | --- | --- | --- |
| `nativephp/desktop` | 2.3.1 | `^8.3` | `^10 – ^13` | Current desktop line (Electron + embedded PHP server, real request cycle) |
| `nativephp/electron` + `nativephp/laravel` | 1.3.0 / 1.3.1 | `^8.3` | `^10 – ^13` | Legacy desktop v1 line |
| `nativephp/mobile` | 4.5.2 | `^8.3` | `^10 – ^13` | Current mobile: **SuperNative**, native SwiftUI/Compose UI |
| `nativephp/mobile` | 3.3.8 | `^8.3` | `^10 – ^13` | Previous major: web-view UI, plugin architecture, persistent runtime from 3.1 |

Desktop and mobile are **separate products with colliding `native:*` commands** — a project installs
one, never both. See `laravel-nativephp`.

## Official machine-readable docs for libraries

Some libraries publish an `llms.txt` — an official, agent-targeted documentation index — and/or serve
their docs as per-page markdown. Prefer these over prose docs when they exist, and check the
published version label against the installed version.

### A 200 response is not evidence

**Verify the content, not the status code.** Single-page-app docs sites return `200` with their HTML
shell for *any* path, so `…/llms.txt` can appear to exist while returning a documentation page.
Confirmed false positives on 2026-09-29:

- `livewire.laravel.com/docs/llms.txt` → **200, but it is HTML** (the "Quickstart" page). Livewire has
  no official `llms.txt`.
- `alpinejs.dev/llms.txt` → **200, but it is HTML**. Alpine has no official `llms.txt`.

Trust an `llms.txt` only if its content starts with an H1 and a blockquote summary. Otherwise treat
it as absent — and say so rather than citing it.

### Verified surfaces

| Library | Official machine-readable surface | Verified |
| --- | --- | --- |
| **Pest** | `https://pestphp.com/llms.txt` (9 KB index) · `https://pestphp.com/llms-full.txt` (400 KB, full docs in one file) · per-page `{docs-url}/llms.txt` | 2026-09-29 |
| **Flux UI** | `https://fluxui.dev/llms.txt` (8.5 KB index) · per-page markdown `https://fluxui.dev/docs/{page}.md` · upgrade guide `docs/upgrading.md` | 2026-09-29 |
| **daisyUI** | `https://daisyui.com/llms.txt` (79 KB, declares `version: 5.7.x`) | 2026-09-29 |
| **Filament** | `https://filamentphp.com/docs/llms.txt` (44 KB versioned index) · per-page markdown `https://filamentphp.com/docs/{major}.x/{path}.md` | 2026-09-29 |
| **Laravel framework** | Per-page versioned markdown `https://laravel.com/framework/docs/{x}.x/{page}.md` · AI page `…/13.x/ai.md` · Boost `…/13.x/boost.md` | 2026-09-29 |
| **Tailwind CSS** | **None, deliberately** — upstream rejected the `llms.txt` proposal. Versioned prose: `tailwindcss.com/docs` (v4) · `v3.tailwindcss.com` (v3) | 2026-09-29 |
| **Livewire** | **None** — no machine-readable index. Versioned prose only: `livewire.laravel.com/docs/{x}.x/{page}` | 2026-09-29 |
| **Alpine.js** | **None.** Upgrade guide at `https://alpinejs.dev/upgrade-guide` | 2026-09-29 |
| **Inertia** | **None.** Upgrade guide at `https://inertiajs.com/upgrade-guide` | 2026-09-29 |
| **NativePHP** | **None.** Versioned docs per product/major on `nativephp.com` | 2026-09-29 |
| **maryUI** | **None.** Docs at `mary-ui.com/docs/installation` (the `/docs` root 404s) | 2026-09-29 |

### Third-party corpora — Context7

Context7 (Upstash) indexes thousands of libraries and serves a text corpus per library. Useful as a
**fallback for the long tail** this plugin deliberately does not cover — not as a primary source.

| Surface | URL |
| --- | --- |
| Library corpus | `https://context7.com/{org}/{repo}/llms.txt` — returns Context7's **own** format (prose + source URL + code block), **not** the `llms.txt` spec. Verified: Livewire 35 KB · Inertia 55 KB · Alpine 45 KB · Laravel framework 51 KB |
| Search | `https://context7.com/api/v1/search?query={q}` → JSON `results[]` with `id`, `title`, `totalSnippets` |
| Library | `https://context7.com/api/v1/{org}/{repo}?type=txt&topic={topic}` |
| MCP server | `@upstash/context7-mcp` 4.1.1 → mounted as a `dsh-mcp-client` entry (`serverName: context7`) |

**Three caveats that matter:**

1. **It is not `llms.txt`.** The path looks like one, but the body is Context7's own snippet format.
   Do not cite it as an official upstream surface.
2. **Version addressing is by `topic`, not by path.** `…/livewire/livewire/4.x/llms.txt` is a **404**.
   Version selection happens through the API's `topic` parameter, so it cannot be relied on for
   version-exact syntax the way `laravel.com/framework/docs/{x}.x/{page}.md` can.
3. **The corpus is derived from the project's own docs**, so its quality mirrors theirs. maryUI's
   corpus (1.9 KB) is entirely about *contributing* to the package — clone the repo, `yarn dev` — and
   says nothing about using it in an application.

Where it does not help: **Tailwind and NativePHP have no corpus at those paths** (404 — consistent
with Tailwind declining to publish machine-readable docs at all).

**Source preference, in order:** upstream version-scoped `.md` docs (Laravel, Filament, Flux, Pest) →
upstream `llms.txt` where it exists (daisyUI, Filament, Pest, Flux) → Context7 for anything neither
covers. **Never let Context7 override an upstream source for the installed version.**

### Repository AI files — present, but not app guidance

Several projects ship `AGENTS.md` / `CLAUDE.md` in the repo. **Check what they are before citing
them**: the ones below are *contribution* guidance for working on the library itself, not guidance
for building applications with it.

| File | Content |
| --- | --- |
| `filamentphp/filament` → `{4.x,5.x}/AGENTS.md` (12 KB) | Naming conventions, test conventions for contributing to Filament |
| `pestphp/pest` → `{master,5.x}/AGENTS.md` (7 KB) | Contribution guidance |
| `livewire/livewire` → `main/CLAUDE.md` (2.6 KB) | Project/architecture overview for contributors |
| `alpinejs/alpine` → `main/CLAUDE.md` (3.5 KB) | Contribution guidance |

Not present: `laravel/framework`, `laravel/boost` (it *generates* agents' files rather than shipping
one), `inertiajs/*`, `saadeghi/daisyui`, `tailwindlabs/tailwindcss`, `NativePHP/*`,
`robsontenorio/mary`, `livewire/flux`, `livewire/volt`.

Where no official `llms.txt` exists, fall back to the versioned documentation URL — and say
so rather than inventing a machine-readable source.

## How to re-verify

```powershell
# PHP packages
Invoke-RestMethod "https://packagist.org/packages/<vendor>/<package>.json" |
  ForEach-Object { $_.package.versions.PSObject.Properties.Name } | Select-Object -First 20

# JS packages
Invoke-RestMethod "https://registry.npmjs.org/<package>/latest" | Select-Object version
```

Never state a version from memory in a skill. Read `composer.lock` / `package-lock.json` for
the project, and this file only for orientation — then re-verify if the number matters.
