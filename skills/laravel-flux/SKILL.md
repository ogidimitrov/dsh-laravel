---
name: laravel-flux
description: Build Livewire UI with Flux components, respecting the free and Pro tiers.
---

# Flux UI

Flux is the official Livewire component library (`livewire/flux`, latest **2.20.1** at
2026-09-29, PHP `^8.1`). It requires Livewire and is the component layer the official Livewire
starter kit uses.

## Establish the tier before using a component

Flux ships **free** and **Pro** tiers, and the available component set differs. Pro is a paid
licence.

1. `composer.lock` → `livewire/flux` version.
2. Check for a Flux licence key / Pro package in the project's config or `composer.json`
   repositories. If it is not clearly Pro, **assume free**.
3. A component that exists in the docs but not in the installed tier is not available — check the
   tier before writing it, rather than shipping markup that renders nothing.

Docs: Flux serves versioned markdown, so there is no reason to rely on memory —

- **Index:** `https://fluxui.dev/llms.txt`
- **Per page:** `https://fluxui.dev/docs/{page}.md` (e.g. `installation.md`, `theming.md`,
  `patterns.md`, `customization.md`)
- **Upgrade guide:** `https://fluxui.dev/docs/upgrading.md` (currently **v1.x → v2.x**)

Read the page for the installed major and tier.

## Use Flux, don't re-implement it

The point of the library is that standard UI is not hand-rolled.

- Use `<flux:button>`, `<flux:input>`, `<flux:modal>`, `<flux:select>`, `<flux:table>` and
  friends instead of bespoke markup duplicating them.
- Use `Flux::toast()` for notifications rather than a custom flash-message partial.
- Use Flux's form/field components so validation error display, labels, and `wire:model`
  wiring stay consistent with the rest of the app.

## Layering rules

- **Livewire rules still apply.** A Flux component is a Livewire component: the server owns
  state, `render()` must not query, and actions must authorize. See `laravel-blade-livewire`.
- **Do not mix a second component library into Flux markup.** daisyUI, Flowbite, or hand-rolled
  Bootstrap-style CSS alongside Flux components produces inconsistent tokens and focus states.
  If the app uses daisyUI for the public site, keep Flux for the app shell and do not blend them
  in the same component.
- **Do not re-style Flux internals.** Prefer the component's documented variants/props and the
  theme entry points over overriding internal classes, which break on upgrade.
- **Flux and Filament are different layers.** Filament panels should use Filament components; a
  Flux component inside a Filament resource fights the panel's design system.

## Version discipline

Flux is at **2.x**, and the v1 → v2 upgrade is documented at
`https://fluxui.dev/docs/upgrading.md` — read it rather than reconstructing the differences.

Verified prerequisites for **Flux v2**: **Laravel 10 or later** and **Livewire 3.5.19 or later**.
Check both in `composer.lock` before assuming a component in the v2 docs is available.

- Component APIs and the available component set change **between majors and between the free and Pro
  tiers**. Read the installed version's and tier's docs for the component.
- If a prop or component is not in the docs for the installed version *and* tier, it is not available.
- Flux is Tailwind-based and is bundled into the official Livewire starter kit — so a starter-kit app
  has Flux without it being obvious from `package.json`. Check `composer.lock` for `livewire/flux`.

## Accessibility

Flux handles a lot of accessibility for you — which is a reason to use it. When you compose
components yourself, do not strip the ARIA wiring or the keyboard handling it provides (for
example by replacing a `<flux:button>` with a styled `<div>` for layout convenience).

## Review checklist

- [ ] Tier resolved (free vs Pro) before using a component
- [ ] Flow components used instead of hand-rolled equivalents
- [ ] `Flux::toast()` used for notifications
- [ ] No second component library blended into Flux markup
- [ ] Livewire correctness rules still honoured (authorization, no queries in `render()`)
- [ ] No overrides of Flux internal classes
- [ ] Accessibility wiring preserved
