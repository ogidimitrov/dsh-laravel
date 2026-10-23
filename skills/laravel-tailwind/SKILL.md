---
name: laravel-tailwind
description: Style Laravel apps with Tailwind CSS, respecting the v3 versus v4 configuration split.
---

# Tailwind CSS in a Laravel app

Tailwind **4 is a rewrite of the configuration model**, not an incremental release. Reproducing
v3 syntax in a v4 app is the single most common styling failure, and it fails quietly: you get
unstyled output rather than an error.

## Resolve the version first

Read `package.json` (`tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/postcss`) and check
which config files exist:

| Evidence | Version |
| --- | --- |
| `tailwind.config.js` / `.ts` + `postcss.config.js` | **v3** pipeline |
| No `tailwind.config.js`, `@tailwindcss/vite` in devDeps | **v4** CSS-first |
| `resources/css/app.css` starts with `@import "tailwindcss"` | **v4** |
| `resources/css/app.css` starts with `@tailwind base;` | **v3** |

Verified latest at 2026-09-29: `tailwindcss` 4.3.3, `@tailwindcss/vite` 4.3.3. Laravel 12+
starter kits, and Laravel 13 skeletons, ship the v4 setup; Laravel 10/11 apps usually have v3.

## v4 (CSS-first)

Configuration lives **in CSS**, not in JavaScript.

```css
/* resources/css/app.css */
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.62 0.19 260);
  --font-display: "Inter", sans-serif;
}

@source "../views/**/*.blade.php";   /* add paths the automatic detection misses */
```

- `@import "tailwindcss";` replaces the three `@tailwind base/components/utilities` directives.
- `@theme { --color-…, --font-…, --spacing-… }` replaces `theme.extend` in a JS config and
  generates real CSS custom properties you can use in your own CSS.
- `@plugin "…";` loads a plugin (this is how daisyUI 5 attaches — see `laravel-daisyui`).
- `@utility` defines custom utilities; `@custom-variant` defines variants.
- Content detection is automatic; `@source` only for paths it cannot see.
- Build via the `@tailwindcss/vite` plugin in `vite.config.js`.
- Requires modern browsers (native cascade layers, `@property`, `color-mix()`).

### v4 renamed and changed utilities

These are renames, not removals — v3 names produce missing styles:

| v3 | v4 |
| --- | --- |
| `shadow-sm` / `shadow` | `shadow-xs` / `shadow-sm` |
| `rounded-sm` / `rounded` | `rounded-xs` / `rounded-sm` |
| `blur-sm` / `blur` | `blur-xs` / `blur-sm` |
| `outline-none` | `outline-hidden` |
| `flex-shrink-0` | `shrink-0` |
| `overflow-ellipsis` | `text-ellipsis` |

Behaviour changes to account for:

- Default **border colour is now `currentColor`**, not `gray-200`. Borders that relied on the
  old default will look wrong; set the colour explicitly.
- Default **ring width is 1px**, not 3px.
- `bg-opacity-*` utilities are gone — use the slash syntax (`bg-black/50`).
- `!important` moved to a **suffix**: `bg-red-500!` (was `!bg-red-500`).
- Opacity/colour utilities compose through the slash and colour-mix systems.

## v3 (JS config + PostCSS)

```js
// tailwind.config.js
export default {
  content: ['./resources/**/*.blade.php', './resources/**/*.js'],
  theme: { extend: { colors: { brand: '#3b82f6' } } },
  plugins: [],
};
```

with `@tailwind base; @tailwind components; @tailwind utilities;` in the CSS entry and the
PostCSS pipeline configured. Design tokens live in JS; to use them from CSS you must import
the generated config.

## Documentation sources

Tailwind publishes **no `llms.txt`** — this is a deliberate upstream decision, not an oversight.
Do not invent one, and do not claim a machine-readable index exists.

- v4 docs: `https://tailwindcss.com/docs`
- v3 docs: `https://v3.tailwindcss.com` (verified reachable)

Use the URL matching the installed major. Reading v4 docs while on v3 (or the reverse) produces
exactly the config-mixing failure described above.

## Design discipline

- **Keep tokens in one place.** `@theme` (v4) or `theme.extend` (v3) — not hardcoded hex values
  scattered through Blade/JSX. A brand colour change should touch one file.
- **Use existing classes only.** Tailwind class names are exact strings; a near-miss silently
  does nothing. Do not invent utilities.
- **Don't mix component libraries** in the same markup (daisyUI + Flowbite + hand-rolled CSS).
  Pick one component layer and use it consistently.
- **Extract repeated combinations** into a Blade component or `@utility` rather than copy-pasting
  a 12-class string; that string is now a place bugs hide.
- **No dynamic class construction.** `` class="text-{{ $color }}-500" `` cannot work — Tailwind
  scans source text. Map to complete class names explicitly.
- Prefer the utility classes to `@apply` in a global stylesheet; deep `@apply` layers recreate
  the CSS you moved away from.

## Review checklist

- [ ] Config style matches the installed major (CSS-first v4 vs JS config v3)
- [ ] No v3 utility names in a v4 app (shadow/rounded/blur/outline renames)
- [ ] Border and ring defaults accounted for
- [ ] Design tokens centralised, not hardcoded in markup
- [ ] No dynamic/interpolated class names
- [ ] Build pipeline matches the version (`@tailwindcss/vite` on v4)
- [ ] Only one component library in use
