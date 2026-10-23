---
name: laravel-daisyui
description: Use daisyUI components with the official llms.txt index and the correct Tailwind pairing.
---

# daisyUI

daisyUI is a **component layer** on top of Tailwind's utility layer. Its version is coupled to
the Tailwind major — getting that pairing wrong is the primary failure mode.

## Resolve both versions first

| Check | Why |
| --- | --- |
| `package.json` → `daisyui` | daisyUI major |
| `package.json` → `tailwindcss` | Must satisfy the daisyUI major's requirement |
| `resources/css/app.css` → `@plugin "daisyui"` | v5 wiring |
| `tailwind.config.js` → `plugins: [require('daisyui')]` | v4 wiring |
| `resources/css/app.css` → `@plugin "daisyui" { themes: … }` | Which themes are enabled |

| daisyUI | Requires | Wiring |
| --- | --- | --- |
| **5.x** (latest 5.7.47) | **Tailwind CSS 4.x** | `@plugin "daisyui";` in the CSS entry |
| 4.x | Tailwind CSS 3.x | `plugins: [require('daisyui')]` in `tailwind.config.js` |

daisyUI 5 **cannot** work on Tailwind 3, and daisyUI 4 on Tailwind 4 is unsupported. If the
profile shows a mismatched pair, report it rather than writing markup against it.

## Read the official machine-readable index

daisyUI publishes an official agent-targeted documentation index — use it instead of recalling
component APIs:

```
https://daisyui.com/llms.txt
```

Verified 2026-09-29: HTTP 200, ~79 KB, self-declares `version: 5.7.x`, and carries
`alwaysApply: true`. It is generated from the daisyUI skill sources, so it is authoritative and
version-labelled.

Protocol:
1. Fetch it.
2. Compare its declared `version:` against the installed `daisyui` version in `package.json`.
   **If they disagree, trust the installed version** and treat the index as a guide to the
   nearest major, not as exact truth.
3. Use it for component markup, class names, and theming.

Its own stated rule, which you should honour: only existing daisyUI class names or Tailwind
utility classes may be used. Do not invent class names or pass off invented ones as daisyUI.

`references/components-and-rules.md` carries the vendor's **12 usage rules**, the colour names and
colour rules, the class categories, the full **65-component taxonomy**, and the vendor's component
discovery protocol — so the common cases need no fetch. Refresh it from `llms.txt` on a new daisyUI
major. Two vendor rules agents break most often: **use the default variant unless a colour/variant was
requested** (`btn`, not `btn btn-primary`), and **do not use `dark:` with daisyUI colour names**.

## Theming

Themes are declared where daisyUI is registered:

```css
/* Tailwind 4 + daisyUI 5 */
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

- Use **semantic** colour classes (`bg-primary`, `text-primary-content`, `bg-base-200`,
  `border-base-300`) rather than hardcoded palette colours. Semantic classes are what make
  theme switching work; `bg-blue-500` breaks it.
- `base-100/200/300`, `primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`,
  `error` — plus their `-content` pairings for foreground text.
- Switching themes at runtime means setting `data-theme` on the root element. Don't patch
  individual component colours to fake a theme.

## Rules

- **Do not mix component libraries.** daisyUI class names alongside Flowbite/Bootstrap-style
  hand-rolled CSS in the same markup produces inconsistent spacing, focus states, and theming.
- **Tailwind still applies.** `laravel-tailwind` governs the utility layer and the Tailwind
  major; this skill governs the component layer. Route to both when Tailwind is v4 and daisyUI
  is v5.
- **Do not apply daisyUI classes inside Filament components.** Filament has its own styling
  system — mixing the two fights the panel's design tokens. Use Filament's own components there.
- **Prefer daisyUI components over hand-built equivalents** for standard UI (buttons, modals,
  drawers, tables, alerts). That is the point of the library.
- **Component markup is versioned.** Check the class against the fetched index for the installed
  major rather than reusing an example from a different daisyUI version.
- Accessibility is still your responsibility: daisyUI styles an element but does not add the
  ARIA attributes, labels, or keyboard handlers a component needs.

## Review checklist

- [ ] daisyUI major and Tailwind major are a supported pairing
- [ ] Official `llms.txt` fetched; declared version reconciled with the installed version
- [ ] Only real daisyUI classes / Tailwind utilities used
- [ ] Semantic colour classes used (theming preserved)
- [ ] No second component library mixed in the same markup
- [ ] No daisyUI classes leaking into Filament components
- [ ] Accessibility attributes present on interactive components
