---
name: laravel-alpine
description: Add lightweight Alpine.js interactivity without breaking Livewire or inventing state.
---

# Alpine.js

Alpine handles **local, presentational** state. Livewire handles state the server needs. Most
Alpine bugs in Laravel apps come from blurring that line.

Verified latest at 2026-09-29: `alpinejs` 3.17.4. Alpine 3 is current; plugins are separate
packages (`@alpinejs/persist`, `@alpinejs/intersect`, `@alpinejs/collapse`, `@alpinejs/focus`,
`@alpinejs/mask`, `@alpinejs/morph`, `@alpinejs/resize`, `@alpinejs/anchor`).

## Establish which Alpine is in play

1. `package.json` → `alpinejs` and any `@alpinejs/*` plugins (explicit install).
2. `livewire/livewire` in `composer.lock` → **Livewire 3+ bundles Alpine**. Check the version
   before adding your own `alpinejs` dependency; two copies on the page break everything.
3. Register plugins and components **before** Alpine starts:

```js
document.addEventListener('alpine:init', () => {
    Alpine.data('invoiceRow', (id) => ({
        open: false,
        toggle() { this.open = !this.open },
    }));
});
```

## Use Alpine for

Open/closed panels, tabs, hover/dropdown menus, local toggles, client-only filters, copy-to-clipboard,
intersection-triggered reveals, formatting previews. Anything that does not need a round trip.

## Do not use Alpine for

- **Anything the server must know.** Validation, authorization, persistence, computed business
  values. That is Livewire or a request.
- **Data already in a Livewire property.** Mirroring it in Alpine creates two sources of truth
  that drift. Bind through `wire:model` instead.
- **Authorization.** Hiding with `x-show` is presentation. Enforce server-side.
- **Large client state.** Alpine is not a state manager; reaching for stores/global state means
  the page wants a real framework.

## Core correctness rules

- **`x-cloak`** on anything that would flash before Alpine loads, with `[x-cloak]{display:none}`
  in your CSS. Without it, users see unstyled content and menus popping open.
- **`x-for` needs `:key`** and a `<template>` root. Missing keys cause the same
  wrong-state-on-wrong-row class of bug as a missing `wire:key`.
- **Never `x-html` with user data.** It is the Alpine equivalent of `{!! !!}` / `v-html` and is
  an XSS sink. Use `x-text`.
- **Prefer `x-data` scoping** — one component per concern, not one giant `x-data` on `<body>`.
- **`x-init` for setup, `$watch` for reactions**; avoid `x-init` blocks that also mutate what
  they watch.
- **Use modifiers deliberately**: `@click.prevent`, `.stop`, `.outside`, `.window`, `.debounce`.
  `.outside` on a dropdown is what makes click-away work.
- **Do not manipulate DOM that Livewire owns.** Livewire re-renders and will overwrite you.

## Coexisting with Livewire

- `wire:ignore` marks a subtree Livewire must not touch. Required when a third-party JS library
  (chart, date picker) owns that DOM, otherwise every Livewire render destroys its state.
- Livewire dispatches browser events (`$dispatch`) that Alpine can listen for, and
  `Livewire.on(...)` works in JS. Use that instead of reaching into internal Livewire APIs.
- Alpine state inside a `wire:ignore` subtree is not re-initialised on re-render — initialise it
  explicitly in an `x-init` or a Livewire `@script` block if it must survive updates.

## CSP

If the app enforces a Content Security Policy without `unsafe-eval`, standard Alpine will be
blocked. Use Alpine's CSP build and avoid complex inline expressions (attribute-level logic
beyond simple property access). Check whether the project is CSP-constrained before writing
inline evaluative expressions.

## Testing

Alpine logic is not covered by PHP tests. If behaviour is non-trivial:

- Extract it into a JS module and unit-test that module, or
- Move the rule server-side if it is actually a business rule (it usually is), or
- Keep it trivially small enough that review is sufficient.

Never claim a visual interaction is verified by a PHP test.

## Review checklist

- [ ] Only local/presentational state in Alpine; server state in Livewire
- [ ] No duplicated truth between an Alpine property and a Livewire property
- [ ] `x-cloak` + CSS rule present where needed
- [ ] `x-for` has `:key` and a `<template>` root
- [ ] No `x-html` with user-controlled content
- [ ] `wire:ignore` used around third-party DOM
- [ ] No second Alpine copy loaded when Livewire already bundles one
- [ ] Plugin registration happens on `alpine:init`
