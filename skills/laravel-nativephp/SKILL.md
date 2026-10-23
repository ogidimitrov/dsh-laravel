---
name: laravel-nativephp
description: Build NativePHP desktop or mobile apps, or assess whether a Laravel app fits the native shell model.
---

# NativePHP

NativePHP runs a full Laravel application inside a **native application shell** on the device,
with a compiled PHP binary shipped in the app — the user installs nothing else and no web server
is required.

Verified at 2026-09-29 (Packagist):

| Product | Package | Latest | PHP | Laravel |
| --- | --- | --- | --- | --- |
| Desktop (current) | `nativephp/desktop` | **2.3.1** | `^8.3` | `^10 – ^13` |
| Desktop (v1 line) | `nativephp/electron` + `nativephp/laravel` | 1.3.0 / 1.3.1 | `^8.3` | `^10 – ^13` |
| Mobile (current) | `nativephp/mobile` | **4.5.2** | `^8.3` | `^10 – ^13` |
| Mobile (previous major) | `nativephp/mobile` | 3.3.8 | `^8.3` | `^10 – ^13` |

## First rule: it is two products, pick one

Desktop and mobile are **separate toolchains**. Both register the `native:*` artisan commands, so
**do not install both in one project**. Detect which is present from `composer.lock` and route to
that product's docs only.

- Desktop v2 docs: `https://nativephp.com/docs/desktop/2/getting-started/introduction`
- Mobile v4 docs: `https://nativephp.com/docs/mobile/4/getting-started/introduction`
- Mobile v3 docs: `https://nativephp.com/docs/mobile/3/getting-started/introduction`

Resolve the installed major and read *that* major's docs. The mobile line changed architecture
twice in two majors; details do not carry across.

## Use cases

### Desktop (`nativephp/desktop` 2.x)
- Internal line-of-business tools that already exist as Laravel apps.
- Kiosk / POS / back-office terminals, including **offline-capable** operation.
- Tray/background apps that need filesystem and OS integration.
- Developer or operator tooling packaged as a double-clickable app.
- Shipping the *same* Laravel codebase to Windows/macOS/Linux instead of maintaining a separate
  Electron app.

### Mobile (`nativephp/mobile` 3.x / 4.x)
- A companion app that shares models, validation, and business logic with the web app.
- Offline-first field apps (inspections, deliveries, audits) syncing when connectivity returns.
- Apps needing device features: camera, biometrics, geolocation, barcode scanning, push.
- A single codebase targeting iOS and Android, including Filament admin UI on-device (works on
  mobile 3.1+ because `intl` is available on iOS).

### Poor fits — say so instead of proceeding
- **High-fidelity, per-platform custom UI** where iOS and Android are meant to look different by
  design. SuperNative (mobile v4) narrows this gap but is a mapping layer, not a native design team.
- **Heavy graphics / games / real-time rendering.** Wrong tool.
- **Thin web-view wrappers with little added functionality** — this risks App Store rejection
  under Apple's minimum-functionality rule (guideline 4.2). If the app is a wrapper, reconsider.
- **Server-authoritative logic** that must not ship to the device.
- **"Add a desktop version" as an afterthought**, with no plan for data sync or auth against the
  server. The packaging is the easy part; the sync model is the project.

## Major-version differences to know

### Desktop
- **v1** (`nativephp/electron` + `nativephp/laravel`): the original Electron wrapper line.
- **v2** (`nativephp/desktop`): current. Electron-based with an embedded PHP server and a **real
  request cycle**, so normal Laravel request semantics hold. Windows, shortcuts, and menus are
  bootstrapped in `NativeAppServiceProvider::boot()`; an `ApplicationBooted` event fires after
  boot; `php.ini` directives can be set via `ProvidesPhpIni::phpIni()`.

### Mobile
- **v3**: the plugin-based architecture. Core APIs ship as **plugins**, and plugins must be
  **registered via `NativeServiceProvider`** — installing one is not enough, because native code has
  to be compiled in. That registration step is deliberate: it prevents a transitive dependency from
  silently pulling native code into your binary. Plugin management uses `native:plugin:*`
  commands, and PHP calls native code through `nativephp_call()` declared in a `nativephp.json`
  manifest.
- **v3.1**: the **persistent PHP runtime** — Laravel boots once and stays resident, with
  background queue workers, a lower Android minimum, and `intl` on iOS.
- **v4**: **SuperNative** — the web view is replaced as the default UI. `native:` Blade components
  compile to real SwiftUI (iOS) and Jetpack Compose (Android) views; PHP writes directly into
  shared memory instead of serializing across a bridge; screens are PHP classes extending
  `NativeComponent` registered with `Route::native()`, with `#[Poll]`, `#[Computed]`, `#[Lazy]`,
  and `#[Locked]` attributes. It is testable in-process with Pest, and platform accessibility comes
  with the native widgets.
  - SuperNative is the default for new apps; the web view remains available via a
    `<native:web-view>` component, so a migration can proceed screen by screen.
  - Some previously separate plugins became **core** in v4, which means the standalone plugin
    packages **conflict** and must be removed for v4.
  - The Vite dev server is **opt-in** (a `--vite` flag) rather than automatic.

Per-version minimum PHP and the exact plugin/core split are documented per mobile major — verify
against the installed major rather than assuming, since the package constraint (`^8.3`) and the
docs' stated requirements have differed.

## The lifecycle constraint — the most important correctness issue

**Desktop has a normal request cycle. Mobile v3.1+ does not.** This is the single fact most likely
to cause a subtle, hard-to-find bug.

On mobile with the persistent runtime, a screen's runloop holds **one request open for as long as
the user stays on that screen**: render → publish → wait for an event → dispatch → repeat. The
consequences:

- **`Kernel::terminate()` does not fire while the app is in use.** Anything you rely on running at
  request end — flush hooks, deferred cleanup, telemetry finalisation — will not run when you
  expect. Do not build on terminate semantics.
- **Per-request state must not leak.** Same class of constraint as Octane: no mutable state in
  singletons/statics, no caching request-scoped data in a shared binding, careful with `once()`.
- **Background work belongs on the queue worker**, which runs in its own runtime. Set
  `QUEUE_CONNECTION=database` so jobs persist to the on-device SQLite database and survive
  restarts.
- **Use screen lifecycle events** (`mount()`, `onResume()`, `unmount()` — available in mobile
  ^4.1) rather than assuming a request boundary.

If the app is Octane-aware, much of the discipline already exists — but do not assume it does.

## Rules

- **Pick one product.** `native:*` command collisions otherwise.
- **Never assume web-server lifecycle**, especially on mobile.
- **Migrations run on the device.** An irreversible or destructive migration is far more dangerous
  here — the user's local data is the only copy unless you sync it. Test migrations on an
  existing installed app, not only on a fresh install.
- **Never ship secrets in the app.** The device holds the code and its configuration; assume
  everything in the binary is readable. Keep privileged operations server-side.
- **Don't apply Livewire/Blade DOM rules to SuperNative components.** A `native:` component maps to
  a real platform widget through EDGE, not to HTML — the mental model is a component class with
  server-driven state, not a Blade template.
- **A NativePHP app is still a Laravel app.** `laravel-conventions`, `laravel-solid`, and the
  version rules all apply; this skill only adds the shell-specific constraints.
- **Store distribution is a real constraint.** Review the platform's rules (notably Apple's
  minimum-functionality guideline) before committing to a wrapper-style design.

## Review checklist

- [ ] Exactly one NativePHP product installed (desktop **or** mobile)
- [ ] Installed major resolved; docs read for that major, not a neighbouring one
- [ ] Lifecycle model confirmed (desktop request cycle vs mobile persistent runtime)
- [ ] No reliance on `Kernel::terminate()` / request-end flush on mobile
- [ ] No request-scoped state in singletons; `once()` usage reviewed
- [ ] Background work dispatched to the queue worker (`QUEUE_CONNECTION=database`)
- [ ] Migrations safe for an existing installed app with local data
- [ ] No secrets in the shipped app; privileged operations server-side
- [ ] Mobile v4: standalone plugins that became core removed (conflicts)
- [ ] Mobile v4: SuperNative vs `<native:web-view>` choice deliberate, not accidental
- [ ] Store-review risk assessed if the app is largely a web-view wrapper
