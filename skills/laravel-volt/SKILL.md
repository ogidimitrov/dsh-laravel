---
name: laravel-volt
description: Write Livewire components in Volt's single-file form, or correctly migrate off Volt on Livewire 4.
---

# Volt

Volt (`livewire/volt`, latest **1.11.2** at 2026-09-29, PHP `^8.1`) lets Livewire components be
defined in a single Blade file using a functional API.

## Check whether Volt still applies — this changed in Livewire 4

**On Livewire 4, Volt is absorbed into Livewire core.** The official upgrade guide directs you
to: update component imports, update route definitions, update test files, **remove the Volt
service provider, remove the `livewire/volt` package, and install Livewire v4**.

So:

| Livewire | Volt situation |
| --- | --- |
| **4.x** | Do **not** add `livewire/volt`. If present, it is a migration target — remove the package and service provider |
| 3.x | Volt is a separate package; single-file components are Volt's feature |
| 2.x | Volt is not applicable |

Confirm against `composer.lock` and the installed Livewire version's docs
(`https://livewire.laravel.com/docs`). The `/docs/volt` path now resolves into the current
Livewire version's docs, so read it in the installed version's context rather than assuming a
stable Volt-specific page.

## Volt's shape (Livewire 3 + Volt)

A Volt component is one Blade file — typically under `resources/views/livewire/` — with a
`<?php ... ?>` block and an `@volt` block that wire the component:

- `state(...)` / classic public properties for state
- `computed(...)` for derived values
- `action(...)` for methods callable from the template
- `rules(...)` / `validate()` for validation
- `mount(...)` for initialisation
- `locked(...)` / `protect()` for properties that must not be client-writable

Routing uses Volt's own helper:

```php
Volt::route('/counter', 'counter');
```

Testing uses `Volt::test('counter')`, which returns the standard Livewire test harness.

## Rules

- **Everything from `laravel-blade-livewire` still applies.** A Volt component *is* a Livewire
  component: authorization in the action, no queries in `render()`, `wire:key` in loops,
  `locked`/`protect` on identity properties, bounded result sets. Single-file syntax changes the
  layout, not the correctness rules.
- **Do not convert existing class components to Volt** (or the reverse) unless asked. It is a
  large diff with no behavioural benefit and it obscures the real change in review.
- **Do not use Volt for a component that needs a lot of PHP.** Volt's value is small,
  self-contained components. Heavy logic belongs in a class component or an action class.
- **Resolve the installed major first.** Do not write `Volt::` calls into a Livewire 4 app that
  has already dropped the package, and do not write v4-style single-file component syntax into a
  Livewire 3 + Volt app.
- **Check the package is actually installed.** If `livewire/volt` is absent from
  `composer.lock`, Volt APIs do not exist — even if single-file components are possible via
  another mechanism. Verify before writing.

## Migration off Volt (Livewire 4)

Follow the official guide's order and verify each step:

1. Update component imports.
2. Update route definitions to the Livewire 4 routing form (`Route::livewire(...)`).
3. Update test files.
4. Remove the Volt service provider.
5. Remove the `livewire/volt` package.
6. Install/upgrade Livewire v4.

Run the project's test suite after each step rather than at the end, so a failure localises.

## Review checklist

- [ ] Livewire major resolved; Volt applicability confirmed
- [ ] No `Volt::` usage in a Livewire 4 app that has removed the package
- [ ] Livewire correctness rules honoured (authorization, no queries in `render()`, `wire:key`)
- [ ] Locked/protected properties for identity-bearing state
- [ ] No gratuitous class↔Volt conversions mixed into an unrelated change
- [ ] Tests updated and actually run
