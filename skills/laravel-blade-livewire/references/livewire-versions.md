# Livewire major-version differences (2.x · 3.x · 4.x)

Sourced from the Livewire upgrade guides (`livewire/livewire` → `docs/upgrading.md`) and
package metadata. Verified **2026-09-29**. Latest at verification: **4.4.7** (PHP `^8.1`).

Match the installed major from `composer.lock` before writing a component. Livewire majors
change real APIs; porting remembered syntax across them is the most common Livewire failure.

## 4.x (current)

Latest: 4.4.7.

### Config renames and new defaults

`config/livewire.php` keys were renamed and reorganized:

| v3 | v4 |
| --- | --- |
| `'layout' => 'components.layouts.app'` | `'component_layout' => 'layouts::app'` |
| `'lazy_placeholder' => 'livewire.placeholder'` | `'component_placeholder' => 'livewire.placeholder'` |

The layout now resolves through the `layouts::` namespace, pointing at
`resources/views/layouts/app.blade.php` by default.

New/changed defaults worth knowing:

- `smart_wire_keys` is now **`true`** (was `false`). This mitigates `wire:key` problems in
  deeply nested components — **but you must still add `wire:key` manually in loops.** It does
  not remove that requirement.
- `component_locations` defines where view-based and single-file components are discovered.
- `component_namespaces` maps namespaces like `pages::` onto view directories.
- `make_command.type` defaults to **`'sfc'`** (single-file component). Set `'class'` to get v3
  behaviour. This changes what `php artisan make:livewire` produces — check before assuming.
- `make_command.emoji` controls the `⚡` filename prefix.
- `csp_safe` enables CSP mode (uses Alpine's CSP build) to avoid `unsafe-eval`. It **restricts
  complex JS expressions** in directives (`wire:click="addToCart($event.detail.productId)"`) and
  global references like `window.location`. Do not enable it casually in an app that relies on
  those.

### Routing

For full-page components the recommended form changed:

```php
// v3 — still works, no longer recommended
Route::get('/dashboard', Dashboard::class);

// v4 — recommended for all component types
Route::livewire('/dashboard', Dashboard::class);
Route::livewire('/dashboard', 'pages::dashboard');   // view-based component
```

### Behaviour changes from 3.x

- **`wire:model` now ignores child events by default** — a silent behaviour change for nested
  component setups that relied on propagation.
- **Component tags must be closed.** Self-closing/malformed tags that v3 tolerated now fail.
- `wire:transition` uses the **View Transitions API**.
- Update hooks **consolidate array/object changes** (one hook call, not one per key) — loops
  in `updated()` hooks that assumed per-key calls will behave differently.
- `wire:model` modifiers now control **client-side sync timing**; `wire:model` gained bracket
  notation support.
- Asset and endpoint URLs changed; JavaScript APIs were deprecated — check custom JS that
  reached into Livewire internals.
- Islands and other component features are new in v4.

### Volt is absorbed into Livewire 4

The Volt package is **removed** in the v4 upgrade: remove the Volt service provider, remove the
`livewire/volt` package, install Livewire v4, and update component imports, route definitions,
and test files. Volt is a separate package on Livewire 3 (latest `livewire/volt` 1.11.2).

## 3.x

- `wire:model` is **deferred by default**; opt into eager syncing with `.live`.
- `#[Computed]` methods replace `getXProperty()` accessors.
- `dispatch()` + `#[On]` replace `emit()` + `$listeners`.
- Form objects (`Livewire\Form`) are the sanctioned way to hold form state.
- `#[Locked]`, `#[Validate]`, `#[Url]`, `#[Session]`, `#[Reactive]` attributes available.
- `wire:navigate` provides SPA-style navigation.
- Styles and scripts are injected automatically — manual `@livewireStyles`/`@livewireScripts`
  is legacy.
- Alpine is bundled; `$this->js()` dispatches JS from PHP.

## 2.x

- `wire:model` was **eager by default**; `wire:model.defer` opted into deferred syncing — the
  mirror image of 3.x/4.x. Never mix the two mental models.
- Computed values were `getFooProperty()` methods, not attributes.
- Events used `emit()` and a `$listeners` array.
- Validation used a `$rules` property.
- `@livewireStyles` / `@livewireScripts` were **required** in the layout.
- Full-page components were routed with `Route::get(..., Component::class)`.

## Cross-major summary

| Concern | 2.x | 3.x | 4.x |
| --- | --- | --- | --- |
| `wire:model` default | eager | **deferred** | deferred |
| Opt into eager | `.defer` inverts it | `.live` | `.live` |
| Computed | `getXProperty()` | `#[Computed]` | `#[Computed]` |
| Events | `emit()` / `$listeners` | `dispatch()` / `#[On]` | `dispatch()` / `#[On]` |
| Form state | public properties | Form objects | Form objects |
| Full-page route | `Route::get()` | `Route::get()` | **`Route::livewire()`** |
| Styles/scripts | manual directives | automatic | automatic |
| `make:livewire` output | class component | class component | **SFC by default** |
| Volt | — | separate package | **absorbed into core** |

## Rules for any Livewire version

- Resolve the major first, then read that major's docs at `https://livewire.laravel.com/docs`.
  There is **no official Livewire `llms.txt`** — do not claim one exists.
- Never mix binding mental models across majors; a `.defer` in a 2.x app and a missing `.live`
  in a 3.x/4.x app are both bugs in opposite directions.
- `wire:key` is required in loops on every major, regardless of `smart_wire_keys`.
- Public properties are client-writable on every major — use `#[Locked]` (3.x/4.x) and always
  re-authorize in the action.
