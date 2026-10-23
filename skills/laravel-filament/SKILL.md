---
name: laravel-filament
description: Build Filament admin panels that keep domain logic and authorization in the right layer.
---

# Filament admin panels

Applies when `filament/filament` is in `composer.lock`. Filament is a **layer** on top of
Livewire — the app underneath may be Blade, Livewire, Inertia, or API-only.

## Resolve the Filament major, then fetch that major's docs

Filament's namespaces and APIs have changed across majors (2 → 3 → 4 → 5): form/table schemas,
`->form()` placement, action namespaces, and panel configuration have all moved. Read the installed
version from `composer.lock`, then **fetch the docs for that major rather than recalling a pattern
from an earlier one** — Filament serves them per page as markdown:

- **Versioned index:** `https://filamentphp.com/docs/llms.txt` — every page for the installed major,
  including a dedicated `{major}.x/introduction/ai.md` and a version-support policy page.
- **Versioned page:** `https://filamentphp.com/docs/{major}.x/{path}.md`

This removes the knowledge-cutoff problem for Filament entirely: when you are unsure what a
component or namespace looks like on the installed version, fetch its page.

Also check which panel provider pattern the app uses (`app/Providers/Filament/*PanelProvider.php`
or `app/Filament/...`), and whether multiple panels exist (admin, app, customer). Multi-panel
apps have per-panel routing, auth, and tenancy that must be edited in the right provider.

## The cardinal rule: Filament is a UI layer, not a business layer

A Resource, Page, or Widget must not become the place where the domain lives. It is not
reusable, not schedulable, and not testable without Livewire — and it will be duplicated the
moment a second entry point (API, console command, Livewire page) needs the same operation.

```php
// In the Filament Resource / Page:
->action(function (Invoice $record, ChargeInvoice $chargeInvoice) {
    $chargeInvoice->handle($record);          // delegate
    Notification::make()->success()->title('Charged')->send();
})
```

Rules:

- **Business logic goes in actions/services** (`app/Actions`), exactly as any other entry point.
- **Never write queries in a Resource class** beyond the table's base query. Use
  `getEloquentQuery()` / `modifyQueryUsing()` and eager-load there.
- **Validation** belongs in the domain layer or a Form Request–equivalent, even if the
  form also declares rules. Filament form rules are UX; enforce on the write path too.
- **Filament is not the public site.** If the profile shows the panel serving end users,
  flag it — panels ship admin affordances and are not designed for public UX or SEO.

## Authorization

- **Register policies for every model the panel exposes.** Filament respects Laravel
  policies; without them, any authenticated panel user can reach everything.
- Configure the panel's access gate (`canAccessPanel()`) so only intended users get in.
- Use `->authorize()` / policy methods for row-level actions, not `visible()` on the UI,
  which is presentation only.
- **Hide ≠ protect.** A hidden action is still callable. Enforce in the policy.
- Multi-tenancy (`->tenant(...)`) must be paired with tenant-scoped queries and policies —
  never rely on the tenant switcher alone for isolation.

## Tables, forms, and performance

- **Eager load every relation shown in a table column.** Filament renders per row, so an
  un-eager-loaded column is an N+1 across the whole page.
- **Paginate and constrain.** Filament paginates by default; do not remove it on large tables.
- **Use `->searchable()` deliberately** — searchable columns need indexes on large tables.
- Prefer **relationship-aware form components** (`Select::make()->relationship()`) over
  loading every option into memory.
- Keep `->options()` on a large table out of memory: filter, scope, or make it searchable.
- Bulk actions operate on sets — make them chunked and transaction-safe, and re-authorize
  per record inside the action.

## Widgets and dashboards

- Widget queries are real queries: cache or aggregate in SQL rather than loading rows to
  count them in PHP. A dashboard must not issue N queries per widget on every load.
- Make widget authorization explicit so a user does not see aggregate data they may not read.

## Testing

- Filament is Livewire, so `Livewire::test(...)` works for pages and resources.
- Prefer feature tests that exercise the **domain action** plus one panel test proving the
  wiring (that the table lists, the form saves, the policy blocks).
- Assert the policy outcome (403 / absence) for a non-privileged user, not just a hidden button.
- Use Pest/PHPUnit to match the app (see `laravel-testing`).

## Review checklist

- [ ] No business logic inside Resources/Pages/Widgets — delegated to actions
- [ ] Policy registered and enforced for every exposed model and action
- [ ] Panel access gate configured (`canAccessPanel`)
- [ ] Relations eager-loaded in the table query
- [ ] Searchable/sortable columns backed by indexes
- [ ] Multi-tenant panels tenant-scoped in queries, not just in the UI
- [ ] Bulk actions chunked, transactional, and re-authorized per record
