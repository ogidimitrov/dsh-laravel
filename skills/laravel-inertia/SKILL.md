---
name: laravel-inertia
description: Build Inertia SPA features on Laravel with a correct server/client contract and typed props.
---

# Inertia SPA (React / Vue / Svelte)

Applies when the profile shows `inertiajs/inertia-laravel` plus a `@inertiajs/*` client
adapter. Resolve the client framework from `package.json` — never assume React.

## Resolve versions before writing code

Check `composer.lock` for `inertiajs/inertia-laravel` and `package.json` for
`@inertiajs/react|vue3|svelte`, plus the framework major (React 19 / Vue 3 / Svelte 5).
Inertia's API has changed across majors (`useForm`, deferred props, prefetching, polling
were all added incrementally). Read `https://inertiajs.com` for the installed major.

## Props are a contract

The controller → page-component props are a public interface. Treat them like one.

- **Shape props explicitly.** Type them in TypeScript (`interface InvoiceIndexProps`).
  Untyped props are where Inertia codebases rot: the server changes a key and the client
  fails at runtime in production.
- **Never leak models wholesale.** Return API Resources or explicitly shaped arrays. An
  Eloquent model serialized to props exposes every column you forgot about — including
  `password`, `remember_token`, and internal flags.
- **Resolve props deliberately.** Eager-load everything the page reads. A relation accessed
  in a Vue/React loop is an N+1 per page visit.
- **Use deferred/lazy props** for expensive secondary data (`Inertia::defer()`), and
  `optional` props for data only some visits need.

```php
return Inertia::render('Invoices/Index', [
    'invoices' => InvoiceResource::collection(
        Invoice::query()->with('customer')->latest()->paginate(25)
    ),
    'stats'    => Inertia::defer(fn () => $this->stats()),   // not blocking first paint
]);
```

## Shared data is not a dumping ground

- Global shared props belong in `HandleInertiaRequests::share()` — auth user, flash, locale,
  feature flags. Keep it **small**: it ships on every single response.
- Do not compute queries in `share()`. Add a shared prop only when nearly every page needs it.
- Flash messages: pass them once and clear them; a sticky flash message is a bug.

## Forms and validation

- Use the client's `useForm` helper so validation errors and processing state are handled by
  the framework instead of hand-rolled.
- **Server-side validation is the only validation that matters.** Client checks are UX.
  Return `422` via Form Requests; Inertia surfaces the errors to `form.errors`.
- Follow the POST→redirect→GET pattern after a successful mutation. Returning a view
  directly from a POST leaves a refresh re-submitting the form.
- Keep error display keyed to the field names the Form Request actually produces (nested
  keys use dot notation: `items.0.price`).

## Authorization and security

- Authorize in the controller or via policies; never rely on the SPA not rendering a button.
- Route middleware (`auth`, `verified`, `can:...`) is the enforcement layer for page access.
- CSRF: the Inertia client sends `XSRF-TOKEN` automatically when using the standard setup —
  do not disable CSRF for SPA routes.
- Any prop the client receives is readable by the user. There is no "hidden" prop.
- Sanitize/escape rendered user content in the client component; don't use `dangerouslySetInnerHTML` /
  `v-html` / `{@html}` on user input.

## Navigation, state, and performance

- Prefer **partial reloads** (`only: [...]`) over refetching whole pages for a filter change.
- Use `preserveState` / `preserveScroll` deliberately on filters and pagination; the defaults
  surprise people. Losing scroll position in a long list is a felt regression.
- Prefetch on hover/link intent for the main navigation paths.
- Do not put large collections in props for a table the user will scroll — paginate server-side.
- Asset versioning is automatic; if you hand-roll cache busting, you are fighting the framework.

## Type safety across the boundary

- Keep an explicit TypeScript type per page component mirroring its props. If the project
  generates types (or uses a typed-route helper), use the project's existing mechanism
  instead of inventing a second one.
- If the project uses TypeScript, do not add `.js`/`.jsx` page files. Match the existing
  extension and file naming.

## Testing

- Feature tests assert the Inertia response and its props:
  `$response->assertInertia(fn (Assert $page) => $page->component('Invoices/Index')->has('invoices.data'))`.
- Assert authorization (403 for a user who must not see the page) and prop shape, not the
  rendered markup of the client component.
- Front-end component tests belong in the project's JS test runner if it has one; don't add
  a new runner just for one test.

## Review checklist

- [ ] Props typed in TS and shaped via Resources — no raw models
- [ ] No N+1 in prop resolution; expensive props deferred
- [ ] Form Request validation, `422` surfaced through `useForm`
- [ ] POST redirects (no view-returning mutations)
- [ ] Authorization enforced server-side via policies/middleware
- [ ] Shared props minimal; flash consumed once
- [ ] Partial reloads / preserve* used intentionally
