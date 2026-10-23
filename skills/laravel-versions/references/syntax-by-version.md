# Syntax by version — what exists, and what changed

The question a cutoff model gets wrong is usually **not** "how does this syntax look" but **"does
this syntax exist on the version I'm writing for"**. Writing PHP 8.4 property hooks into a PHP 8.2
app is a fatal error; writing Inertia's optimistic updates into an Inertia 1 app is a runtime
failure. So this file gives you, per version:

1. **Which features exist** (verified against official per-version sources), and
2. **The exact page to read for the syntax** — because a feature name plus the authoritative link is
   what makes the correct syntax reachable without guessing.

Presence is the part this file guarantees. Syntax details come from the linked page for the
installed version — never from recall.

Verified **2026-09-29**. Sources named per section.

## Coverage matrix

What this plugin covers today, so gaps are visible rather than assumed:

| Ecosystem | Version detection | General syntax | New/changed syntax per version |
| --- | --- | --- | --- |
| Laravel framework | ✓ | ✓ | ✓ **strong** — `version-deltas.md` (10→13) + `whats-new.md` |
| **PHP language** | ✓ floors | ✓ | ✓ **this file** (8.1–8.5) |
| Livewire | ✓ | ✓ | ✓ **strong** — `livewire-versions.md` (2/3/4) |
| Tailwind CSS | ✓ | ✓ | ✓ **strong** — `laravel-tailwind` (3 vs 4) |
| NativePHP | ✓ | ✓ | ✓ **strong** — `laravel-nativephp` (desktop 1/2, mobile 3/4) |
| **Inertia** | ✓ | ✓ | ✓ **this file** (v3 what's new, breaking) |
| **Pest / PHPUnit** | ✓ | ✓ | ✓ **this file** (major ↔ PHPUnit mapping, Pest 5 features) |
| maryUI | ✓ | ✓ | ✓ moderate — `laravel-maryui` (1 vs 2, per-minor props) |
| **Filament** | ✓ | ✓ | ⚠️ **this file** — pointer + fetchable versioned docs |
| **Alpine** | ✓ | ✓ | ⚠️ **this file** — upgrade-guide pointer |
| daisyUI | ✓ | ✓ | ⚠️ thin — 5 requires Tailwind 4; component list in `package-syntax-map.md` |
| **Flux UI** | ✓ | ✓ | ✓ **this file** — v1→v2 path, prerequisites, versioned markdown docs |
| Volt | ✓ | ✓ | ✓ absorbed into Livewire 4 |
| Sanctum · Passport · Fortify · Pennant · Folio · Wayfinder | ✓ | ✓ | ✗ not covered — low major churn |
| Horizon · Octane · Reverb · Pulse · Nightwatch · Dusk · Pint · Larastan · Rector · Sail | ✓ | ✓ | ✗ deliberately not covered — see below |
| Vite · TypeScript | ⚠️ partial | ⚠️ partial | ✗ not covered |

**Deliberately not covered:** packages whose majors move rarely and whose syntax has been stable for
years (Pint, Sail, Horizon, Dusk, and similar). Recording their version syntax would create
maintenance with almost no iteration savings. Their *presence and version* is still detected, and
their *usage* is covered in `laravel-tooling`. That is a considered exclusion, not an oversight.

## PHP language — 8.1 → 8.5

Verified by presence-checking each official page `https://www.php.net/manual/en/migration8X.new-features.php`.

| PHP | Syntax that exists from here (verified present) |
| --- | --- |
| **8.1** | Enumerations · `readonly` properties · Fibers · Intersection types · `new` in initializers |
| **8.2** | `readonly` classes · `SensitiveParameter` attribute · Constants in traits |
| **8.3** | Typed class constants · `#[\Override]` attribute · readonly amendments |
| **8.4** | **Property hooks** · `#[\Deprecated]` attribute · Lazy objects · `exit` as a function |
| **8.5** | Pipe operator · `clone` with · `#[\NoDiscard]` · URI extension · Asymmetric visibility · Closures in constant expressions |

**Why this matters more than most entries here:** PHP syntax is used in *every* file, and using a
feature above the app's floor is a **parse error** — the whole request fails, not just one path.

Rules:
- Read the floor from `composer.json` → `require.php`, then confirm the runtime with `php -v`.
- A feature listed for a **later** version is unavailable. There is no polyfill for syntax.
- Property hooks on 8.4 are the common trap: they look like a Laravel feature and are not — they are
  a PHP feature, and on 8.2/8.3 they are a fatal parse error.
- For the exact syntax, read the version's page (URL pattern above) — do not reconstruct it.

## Inertia — v3 is current

Verified from the official upgrade guide (`https://inertiajs.com/upgrade-guide`), "Upgrade Guide for
v3.0".

**What's new in v3:** Vite plugin · HTTP requests · **optimistic updates** · layout props ·
simplified SSR · exception handling.

**Breaking in v3:** changed requirements · **Axios removed** · **`qs` dependency removed**.

The Axios removal is the one that breaks real code: any client code that reached for `axios` — or
relied on Inertia providing it transitively — must be updated to the built-in HTTP client. Installing
`axios` back is a workaround, not a fix; it reintroduces the dependency the release removed.

Inertia's client adapters version **independently** of the server package and of each other's
framework (React 19 / Vue 3 / Svelte 5 are separate majors). Read `package.json` for the adapter and
`composer.lock` for `inertiajs/inertia-laravel`, and check both.

## Pest ↔ PHPUnit — the mapping that actually matters

Verified from the official Pest upgrade guide (`https://pestphp.com/docs/upgrade-guide`). Pest majors
track PHPUnit majors, which is the constraint that bites:

| Pest | Ships on | Notable when upgrading |
| --- | --- | --- |
| **5.x** | **PHPUnit 13** | Updating dependencies; PHPUnit 13 changes |
| **4.x** | **PHPUnit 12** | Snapshot-testing changes · watch & faker plugin deprecations |
| **3.x** | **PHPUnit 11** | `toHaveMethod` / `toHaveMethods` expectations · Pest 2 deprecations |
| **2.x** | PHPUnit 10 | — |
| 1.x | PHPUnit 9 | — |

And the reverse check the plugin already flags: **Laravel's skeleton pins its own PHPUnit major** —
`^12.5.12` on Laravel 13, `^11.5.3` on Laravel 12 — which is *not* the newest standalone PHPUnit
release. So "latest Pest" and "what the app's test runner can run" are different numbers. Resolve both.

**Pest 5 features** (verified from `https://pestphp.com/llms-full.txt`): built on **PHP 8.4** and
**PHPUnit 13**, and adds—
- **Tia Engine** — test impact analysis; re-runs only the tests affected by a change
- **The Agent Plugin** — a single command for AI coding agents to verify a change actually works,
  running inside the real suite (and driving a real browser with the Browser plugin installed). This
  is directly relevant to `laravel-verify`'s tier 4: prefer it over a hand-rolled filter when the
  project has it.
- **Evals** — evaluate LLM output quality from the test suite via `expect()`
- **First-party PHPStan plugin** — teaches PHPStan Pest's `it()`/`expect()`/`$this` so tests are typed

Pest documents itself machine-readably, which removes the guessing:

| Source | Use |
| --- | --- |
| `https://pestphp.com/llms.txt` | 9 KB index of every page |
| `https://pestphp.com/llms-full.txt` | ~400 KB — the **entire** documentation in one file |
| `https://pestphp.com/docs/{page}/llms.txt` | Per-page |

Fetch the installed major's page rather than recalling expectation syntax.

## Filament — read the versioned docs, do not port between majors

Filament's namespaces and schema APIs **move between every major (2 → 3 → 4 → 5)**, so there is no
short delta table that stays true. What is better than a table here is the source:

Verified reachable and containing real content:

- **Per-page markdown for the installed major:** `https://filamentphp.com/docs/{major}.x/{path}.md`
  (e.g. `5.x/resources/listing-records.md` → 47 KB of real documentation)
- **Versioned index of every page:** `https://filamentphp.com/docs/llms.txt`

So for Filament the instruction is: **fetch the page for the installed major** rather than recalling a
pattern. A version-scoped source beats an embedded delta table for a package that restructures this
often.

## Flux UI — v2 is current

Verified from Flux's own markdown docs (`https://fluxui.dev/docs/upgrading.md` and
`docs/installation.md`).

- **Upgrade guide covers v1.x → v2.x.** Read it rather than reconstructing differences.
- **v2 prerequisites:** **Laravel 10 or later** and **Livewire 3.5.19 or later**.
- **Component set differs by tier** (free vs Pro) *and* by major — a component in the v2 docs is not
  necessarily available on your tier.
- **Flux ships inside the official Livewire starter kit**, so a starter-kit app has it without an
  obvious `package.json` entry. Check `composer.lock`.

Why this matters: Flux is the component layer for the official Livewire starter kit, so it is the
most likely Livewire UI in a new Laravel app — and a tier/major mismatch produces markup that simply
renders nothing.

## Alpine — 2 → 3

Alpine's official upgrade guide is at `https://alpinejs.dev/upgrade-guide` (verified), covering
"Upgrade from V2", breaking changes, and deprecated APIs.

The rule that prevents most Alpine problems: Alpine 3 is the current major, and Livewire 3+ **bundles**
Alpine — so an app may be running Alpine without an explicit `package.json` entry, and installing
another copy breaks both. Read `laravel-alpine` for the usage rules; fetch the upgrade guide for the
2 → 3 syntax changes.

## Where to get exact syntax, per ecosystem

| Ecosystem | Version-scoped source |
| --- | --- |
| PHP language | `https://www.php.net/manual/en/migration8X.new-features.php` |
| Laravel | `https://laravel.com/framework/docs/{x}.x/{page}.md` |
| Livewire | `https://livewire.laravel.com/docs/{x}.x/{page}` |
| Filament | `https://filamentphp.com/docs/{x}.x/{path}.md` |
| Inertia | `https://inertiajs.com` (upgrade guide per version) |
| Pest | `https://pestphp.com/docs/upgrade-guide` |
| Alpine | `https://alpinejs.dev/upgrade-guide` |
| Tailwind | `https://tailwindcss.com/docs` · `https://v3.tailwindcss.com` |
| daisyUI | `https://daisyui.com/llms.txt` |

## The rule

**Presence is guaranteed here; syntax comes from the versioned page.** Never conclude that a feature
exists on the installed version because it exists in the language or the library — conclude it from
this file or from the page for that version. A feature above the floor is not a style problem; it is a
parse error, a fatal error, or a runtime failure.
