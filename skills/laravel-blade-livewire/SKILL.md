---
name: laravel-blade-livewire
description: Build server-driven Laravel UI with Blade, Alpine, and Livewire correctly and efficiently.
---

# Blade + Alpine + Livewire

Applies when the stack profile shows Blade views, optionally with `alpinejs`, and/or
`livewire/livewire`. Filament is covered by `laravel-filament`.

## Resolve the Livewire major first

Livewire's API has changed materially across majors (2 → 3 → 4). Read the installed version
from `composer.lock` and work from that version's docs at `https://livewire.laravel.com/docs`
— the same discipline as `laravel-versions` applies here. Do not apply remembered syntax
across majors.

Known cross-major differences to check rather than assume:

| Concern | Older (2.x) | Newer (3.x / 4.x) |
| --- | --- | --- |
| Eager vs deferred binding | `wire:model` was live | `wire:model` is deferred; `.live` opts in |
| Computed values | `getXProperty()` | `#[Computed]` methods |
| Form state | public properties only | dedicated Form objects |
| Root element | one required root | single root element still required |

## Blade

- **Components over includes** for anything with a contract: `php artisan make:component`.
  Use `@props` with defaults and a docblock; includes with implicit `$vars` are a coupling bug.
- **No business logic in views.** A view may format and branch on presentation state; it may
  not query, mutate, or decide policy. Move it to the controller, an action, or a view model.
- **Escape by default.** `{{ }}` escapes; `{!! !!}` does not. Only emit `{!! !!}` for markup
  you generated or explicitly sanitized. Never for user-controlled HTML.
- **Never build SQL or shell strings in a view.**
- Use `@once`, `@push`/`@stack` for assets, and a single layout to avoid duplicate script tags.
- Prefer named routes (`route('invoices.show', $invoice)`) over string URLs — it breaks at
  build time instead of runtime.
- Keep `@php` blocks out of templates; if you need one, the view is doing too much.
- Authorize in the controller/policy, and use `@can` only to hide, never to protect.

## Livewire components

Structure a component as: **public state → validation rules → actions → computed reads →
render**.

```php
final class InvoiceIndex extends Component
{
    public string $search = '';

    #[Url(as: 'q')]
    public string $query = '';

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    #[Computed]
    public function invoices(): LengthAwarePaginator
    {
        return Invoice::query()
            ->when($this->search, fn ($q, $s) => $q->where('number', 'like', "%{$s}%"))
            ->latest()
            ->paginate(25);           // bounded, always
    }

    public function render(): View
    {
        return view('livewire.invoice-index'); // no queries here
    }
}
```

Rules that prevent the common failures:

- **No queries in `render()`.** Use computed properties or `mount()`; `render()` runs on
  every update round trip.
- **Eager load everything the view touches** — a relation accessed in the Blade loop is an
  N+1 multiplied by every Livewire request.
- **`wire:key` on every item in a loop.** Missing keys cause wrong state to attach to the
  wrong row after reordering or filtering — a data-corruption-class bug, not cosmetic.
- **`#[Locked]` on identity-bearing public properties** (IDs, ownership fields). Public
  properties are client-writable; without `#[Locked]` a user can rebind the component to
  another record. **Re-authorize in the action**, every time — never trust that the property
  still points where it did at `mount()`.
- **Validate server-side** with `$this->validate()` / `#[Validate]`, even when the form also
  validates in the browser. Client validation is UX, not enforcement.
- **Use Form objects** for multi-field forms; keep request-shaped state out of the component.
- **Bind lazily by default.** Use `.live`/`.blur`/`.debounce.<ms>` only where the round trip
  earns its latency. Free-text search wants `.debounce.500ms`, not per-keystroke.
- **Avoid `updated()` handlers that mutate the state they watch** — that is an infinite
  round-trip loop.
- **Dispatch events for side effects**, and use `wire:loading`/`wire:target` so slow actions
  are visible and not double-submitted.
- **Authorize destructive actions in the action method**, and re-check ownership from the
  database rather than from component state.
- Remember that Livewire state is **serialized to the client**. Do not put secrets, entire
  models, or large collections in public properties; pass IDs and re-fetch.

## Alpine and Livewire together

- Alpine owns *purely local* UI state (open/closed, hover, local tabs). Livewire owns state
  that matters to the server. Mixing them for the same value causes desync.
- Use `x-data` with a `wire:ignore` boundary only when a third-party JS library owns that
  DOM subtree; otherwise Livewire's morphing will fight the library.
- Prefer Livewire's own `wire:model` over Alpine→Livewire bridges for form inputs.

## Testing

- Component behaviour: `Livewire::test(Component::class)->set('search', 'x')->assertSee(...)`.
- Assert authorization explicitly: an unauthorized user must get 403, not a hidden button.
- Assert the *outcome* (database state, emitted event), not internal property values.

## Flux UI (if `livewire/flux` is present)

Flux ships the official starter-kit components (`<flux:button>`, `<flux:modal>`, `Flux::toast()`).
Use it rather than hand-rolling equivalents, and keep markup in Blade matching the starter
kit's layout conventions. Verify the Flux major against the docs — its components evolve.

## Review checklist

- [ ] Authorized in the action method, with ownership re-checked from the database
- [ ] `#[Locked]` on ID/ownership properties
- [ ] No query in `render()`; no N+1 in the view
- [ ] `wire:key` present on every loop item
- [ ] Server-side validation present
- [ ] Bounded result sets (pagination, not `get()` on unbounded queries)
- [ ] No secrets or large payloads in public properties
