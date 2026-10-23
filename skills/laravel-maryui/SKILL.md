---
name: laravel-maryui
description: Use maryUI components on the Livewire + Tailwind + daisyUI stack with correct wiring and version pairing.
---

# maryUI

maryUI (`robsontenorio/mary`) is a **Blade component library for Livewire**, built on daisyUI
and Tailwind. Verified at 2026-09-29: latest **2.9.10** (v1 line latest **1.41.8**).

Its composer constraints show what it supports: `illuminate/support ^10.0|^11.0|^12.0|^13.0` —
so Laravel 10 through 13. Note that maryUI does **not** declare a `livewire/livewire`
requirement; it provides Blade components, and the interactive ones rely on Livewire being
present in the app.

## The version chain — resolve it as a chain, not a set

maryUI's version determines daisyUI's, which determines Tailwind's. A mismatch anywhere in this
chain produces unstyled output, not an error.

| maryUI | Requires daisyUI | Requires Tailwind | Livewire | Era |
| --- | --- | --- | --- | --- |
| **2.x** | daisyUI **5** | Tailwind **4** (CSS-first) | 3 or 4 | Current — matches Laravel 12+ defaults |
| 1.x | daisyUI 4 | Tailwind 3 (JS config) | 3 | Legacy; the v1 docs site is deprecated |

Detect all four: `composer.lock` → `robsontenorio/mary`, `package.json` → `daisyui` and
`tailwindcss`, plus the Livewire major. If the profile shows maryUI 2 with Tailwind 3, or
maryUI 1 with daisyUI 5, that is an incoherent stack — report it rather than writing markup
against it.

## Installation

```bash
composer require robsontenorio/mary
php artisan mary:install
```

Docs: `https://mary-ui.com/docs/installation` and `https://mary-ui.com/docs/upgrading`
(the bare `https://mary-ui.com/docs` path 404s — link to the real pages).

## The single most common maryUI failure

**maryUI ships no CSS of its own.** Its component classes live inside PHP files in the vendor
directory, so Tailwind must be told to scan them. Without this `@source` line, every component
renders unstyled and it looks like the package did not install:

```css
/* resources/css/app.css — Tailwind 4 + daisyUI 5 */
@import "tailwindcss";

@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}

/* Required: let Tailwind see maryUI's component classes */
@source "../../vendor/robsontenorio/mary/src/View/Components/**/*.php";

@source "../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php";
@source "../../storage/framework/views/*.php";
@source "../**/*.blade.php";
@source "../**/*.js";
```

The Laravel pagination and compiled-view sources matter too: paginated tables and any Blade
classes that only appear in compiled views will otherwise be missing. Because maryUI has no
custom CSS of its own, **theming is done through daisyUI themes or Tailwind overrides** — not by
editing package styles.

## Upgrading 1.x → 2.x

This is primarily a **build-system migration**, not an API rewrite:

1. `composer require robsontenorio/mary:^2.0` then `php artisan view:clear`.
2. Delete `tailwind.config.js` and `postcss.config.js` — Tailwind 4 does not use them.
3. Remove `autoprefixer` and `postcss`; add `daisyui`, `tailwindcss`, `@tailwindcss/vite`.
4. Add the `tailwindcss()` plugin to `vite.config.js`.
5. Rewrite the top of `resources/css/app.css` to the `@import "tailwindcss"` + `@plugin "daisyui"`
   + `@source …` form shown above.

Then expect **visual** change: maryUI 2 follows daisyUI 5's design system, and some components'
internal classes were rearranged for spacing and positioning. Revisit the component docs against
each of your existing usages rather than assuming a clean drop-in.

Two version-specific gotchas to check during and after the upgrade:

- **Tailwind 4 removed the default border colour.** A bare `<hr/>` no longer gets a visible
  border; it needs `class="border-t border-t-base-content/10"`, or a global `@apply` in
  `app.css` to restore the old behaviour.
- **daisyUI 5 smoothed `base-100`/`base-200`/`base-300`**, so body/background class combinations
  can often be simplified — and existing overrides may now be redundant.

## Match the component API to the installed minor

maryUI changes component props within the 2.x line, not only across majors. Verified examples:
v2.3.0 changed the Menu component's `enabled` prop to `hidden` and added `disabled`; v2.4.2 added
`@open` events for Drawer and Modal.

So: **check the changelog on minor bumps too.** Read the component's docs for the installed
version rather than reusing an example from another minor.

## Layering rules

The stack is four layers — keep each in its own lane:

| Layer | Owner |
| --- | --- |
| Interactivity / server state | Livewire (`laravel-blade-livewire` rules apply in full) |
| Utility CSS + config model | Tailwind (`laravel-tailwind`) |
| Design system / semantic colours | daisyUI (`laravel-daisyui`) |
| Component API you write in Blade | maryUI |

- **Do not blend component libraries.** maryUI components next to Flux or Filament components in
  the same view produces conflicting tokens, spacing, and focus states. Pick one per surface.
- **Inside a Filament panel, use Filament components** — not maryUI.
- **Livewire correctness is unchanged.** A maryUI component is Blade + Livewire: authorize in the
  action, keep queries out of `render()`, use `wire:key` in loops, use `#[Locked]` on
  identity-bearing properties.
- **Prefer a maryUI component over hand-rolled daisyUI markup** for anything standard (tables,
  forms, modals, drawers, menus). That is the point of the library.
- **Accessibility is still yours to verify.** maryUI styles and wires components, but label,
  ARIA, and keyboard behaviour on custom composition remain your responsibility.

## Review checklist

- [ ] maryUI / daisyUI / Tailwind / Livewire majors form a coherent chain
- [ ] `@source` line for maryUI's `View/Components/**/*.php` present
- [ ] `@plugin "daisyui"` present with the intended themes
- [ ] Pagination + compiled-view `@source` lines present when tables/pagination are used
- [ ] Component props match the installed **minor**, not just the major
- [ ] No second component library mixed into maryUI views
- [ ] Theming via daisyUI themes / Tailwind overrides (no patching package styles)
- [ ] Livewire correctness rules honoured (authorization, `render()`, `wire:key`, `#[Locked]`)
