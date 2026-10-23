---
name: laravel-versions
description: Teach what each Laravel and ecosystem version introduced, and resolve version-specific rules before writing code.
---

# Write for the installed version, from that version's docs

Laravel ships a major release roughly yearly, and **major releases do contain breaking
changes**. Code that is idiomatic on 13 can be a fatal error on 11. Never write
version-specific code from recall — resolve the version, then read that version's docs.

## 0. Your knowledge has a cutoff — assume it is behind

This is the first thing to internalise. A model's training ends at some date; Laravel ships a major
roughly every year and the surrounding ecosystem ships faster. So the installed version is
**frequently newer than anything you actually know**, and the failure mode is not confusion — it is
writing confident, plausible code against an API that has moved.

Treat your own recall as **unreliable for anything version-sensitive** and use the sources instead:

| Situation | Do this |
| --- | --- |
| Installed version is newer than you know | Use `references/whats-new.md`, then the version-scoped docs below. **The plugin's verified knowledge and the official docs outrank your memory.** |
| You "remember" an API but cannot cite it | Fetch the page for the installed major and confirm the signature before using it |
| The feature is new to you entirely | Read the release notes for that major (`releases.md`) — that is what shipped and when |
| **You need to know whether a syntax feature exists on this version** | `references/syntax-by-version.md` — PHP 8.1–8.5, Inertia, Pest/PHPUnit, Filament, Alpine, plus the coverage matrix of what is and is not covered |
| You are unsure whether an API is available | Check `references/version-deltas.md` or `references/syntax-by-version.md`; if absent, fetch the versioned page rather than guessing |

**Syntax availability is not a style question.** A language or framework feature above the installed
floor is a parse error, a fatal error, or a runtime failure — the whole request fails, not just one
path. Never conclude a feature exists because it exists in the language; conclude it from
`syntax-by-version.md` or the page for that version.

The rule in one line: **never let a version-specific decision rest on recall.** Fetch it, or read
it here, or say you cannot confirm it. A confident wrong API costs a fix iteration; a fetch costs
one tool call.

`references/whats-new.md` carries what each current major introduced, dated, with the source it came
from. Start there when the installed version postdates your knowledge.

## 1. Resolve the exact version

```bash
php artisan --version                                   # if PHP is available
composer show laravel/framework | Select-String versions # version + constraint
```

Or read `composer.lock` → `packages[].name == laravel/framework`. The **locked** version
is the authority, not the constraint in `composer.json`. Also capture PHP (`php -v`,
`composer.json` → `require.php`) — the framework major implies a PHP floor.

## 2. Verified version matrix

Verified against Packagist on 2026-09-29. Re-verify before relying on the patch numbers;
the *policy* columns change rarely, the patched versions change weekly.

| Major | Latest at verification | PHP required | Symfony console | Support status |
| --- | --- | --- | --- | --- |
| **13** | 13.34.0 | `^8.3` | `^7.4 \|\| ^8.0` | Current — bug + security fixes |
| **12** | 12.69.3 | `^8.2` | `^7.2` | Security fixes only (bug fixes ended 2026-08-13) |
| **11** | 11.57.0 | `^8.2` | `^7.0.3` | **EOL** (security support ended 2026-03-12) |
| **10** | 10.50.3 | `^8.1` | `^6.2` | **EOL** |

Support policy for every release: **18 months of bug fixes, 2 years of security fixes**,
and only the newest major of first-party packages gets bug fixes. There has been **no LTS
since Laravel 6** — do not describe 11/12/13 as LTS.

Remove the EOL/security-only caveat only after re-checking the live support table.

The **full package matrix** — Livewire 2/3/4, Flux, Volt, Inertia, Filament, Tailwind 3/4,
daisyUI 4/5, Alpine, Pest/PHPUnit, Pint/Sail/Larastan/Rector/Dusk/Wayfinder/Pennant/Folio/Vite,
plus which libraries publish an official `llms.txt` — is in `references/ecosystem-matrix.md`.
Load it whenever the task depends on a library major, not just the framework major.

## 3. Find the right documentation — the only reliable method

Documentation is versioned by the major. Substitute the **installed** major for `{x}`:

| Purpose | Source |
| --- | --- |
| **Any Laravel page, exact version, as markdown** | `https://laravel.com/framework/docs/{x}.x/{page}.md` — **preferred.** Clean markdown, version-scoped, no search needed (verified: 13.x and 12.x differ) |
| What the major introduced | `references/whats-new.md` in this skill |
| **Which syntax exists on a version, and what changed** | `references/syntax-by-version.md` in this skill — PHP 8.1–8.5, Inertia, Pest/PHPUnit, Filament, Alpine, plus the coverage matrix |
| Upgrade guide (the delta from the previous major) | `https://raw.githubusercontent.com/laravel/docs/{x}.x/upgrade.md` |
| Release notes / support policy | `https://raw.githubusercontent.com/laravel/docs/{x}.x/releases.md` |
| Directory structure for that version | `https://raw.githubusercontent.com/laravel/docs/{x}.x/structure.md` |
| First-party API surface | `https://github.com/laravel/framework/tree/{x}.x/src/Illuminate` |
| Filament, versioned per page | `https://filamentphp.com/docs/{x}.x/{path}.md` (index at `/docs/llms.txt`) |
| daisyUI | `https://daisyui.com/llms.txt` (declares its own version) |
| Livewire | `https://livewire.laravel.com/docs/{x}.x/{page}` (no `llms.txt`) |
| Tailwind | `https://tailwindcss.com/docs` (v4) · `https://v3.tailwindcss.com` (v3) — no `llms.txt` |

Use `web_fetch`/`web_search` to read these. **Reading `upgrade.md` for the installed major,
plus the next major's `upgrade.md`,** is the fastest way to learn both what changed to get
here and what is about to break.

Rules for doc lookup:
- Fetch the versioned URL, never the unversioned `laravel.com/docs` (which serves the newest major).
- If a documented method is absent on the installed version, it is not a bug in the app —
  you are reading the wrong version's docs.
- Prefer the framework source on the matching branch when prose is ambiguous.

## 4. Skeleton era — the most common source of wrong files

Laravel 11 introduced a **slim skeleton**. Both eras are valid on 11+; detect which the
app uses rather than assuming.

| Concern | Classic (≤10 style) | Slim (11+) |
| --- | --- | --- |
| HTTP/middleware/exceptions config | `app/Http/Kernel.php`, `app/Exceptions/Handler.php` | fluent `bootstrap/app.php` (`withMiddleware`, `withExceptions`, `withRouting`) |
| Service providers | array in `config/app.php` | `bootstrap/providers.php` |
| Task scheduling | `app/Console/Kernel.php::schedule()` | `routes/console.php` (or `bootstrap/app.php`) |
| Config files | all published in `config/` | slim by default; publish on demand |
| Console commands | `app/Console/Commands`, registered in Kernel | auto-discovered, or `withCommands` |

**Laravel's own upgrade guide explicitly advises against restructuring a Laravel 10 app
into the slim layout when upgrading.** A classic-skeleton app on 11+ is correct. Add
middleware/providers to the existing Kernel, not to `bootstrap/app.php`.

API routes and broadcasting are **opt-in** on 11+: `php artisan install:api` and
`php artisan install:broadcasting`. Their absence is not a misconfiguration.

## 5. High-risk version deltas to check every time

These are the APIs that most often differ across 10 → 13. Full detail, per version, is in
`references/version-deltas.md`. Load it when the task touches any of these:

- **Eloquent model configuration** — attribute-based (`#[Table]`, `#[Fillable]`) vs the
  `casts()` method vs the `$casts` property.
- **Mass assignment / `$fillable`** — protected by default from 11 onward.
- **Migrations** — modifying columns, floating-point types, SQLite minimum version (all 11).
- **Doctrine DBAL** — removed in 11; `->change()` no longer routes through it.
- **Carbon** — Carbon 3 landed in 11; date mutators and `diff*` return values changed.
- **Password rehashing** — automatic from 11; needs `$authPasswordName` if the column is renamed.
- **Rate limiting** — per-second limits from 11.
- **Attributes** — first-class PHP attribute configuration spread across the framework in 13.
- **Testing deps** — the Laravel 13 skeleton pins `phpunit/phpunit ^12.5.12`; the Laravel 12
  skeleton pins `^11.5.3`. The newest standalone PHPUnit release (13.x) is *not* what a Laravel
  skeleton installs. Pest majors likewise move independently; a Pest 4/5 test file will not run
  on Pest 2.

## 6. Hard rules

- If the app is EOL or security-only, say so once, concretely, and continue with the
  version-appropriate (not newest) API. Do not silently upgrade code to newer syntax.
- Never introduce a dependency that raises the PHP floor above the app's actual PHP.
  Check `composer why-not php <version>` before proposing an upgrade.
- Never write 13-only syntax (attribute-based model config, `Cache::touch()`) into a
  project whose profile is 11 or 12.
- When you cannot determine the version, ask — do not default to the newest major.
