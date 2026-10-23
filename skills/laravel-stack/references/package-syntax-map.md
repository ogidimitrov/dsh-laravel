# Package → syntax map: write with the correct prefix

The most common *syntax* error is not a wrong API for the version. It is the right API with the wrong
**prefix, namespace, or registration** for the installed package — `wire:model` where `x-model`
belongs, `<flux:button>` where `<x-flux-button>` belongs, `Volt::` on a Livewire 4 app where Volt no
longer exists.

Two rules govern everything below:

1. **Use the prefix the installed major documents** — resolve the version first.
2. **When a prefix is registration-dependent, confirm it in this application.** Never infer it from a
   class name. A package can register `<x-mary-card>` or `<x-card>`, and only the app knows which.

## Blade component prefixes are registration-dependent

A Blade component name is chosen at *registration*, not by the package's class name. So for any
package whose UI is Blade components, do this instead of guessing:

1. **Grep the app's existing views** for the package's components — this is ground truth and it is
   one tool call. `laravel-recon`'s search-before-create step covers it.
2. Read the package's service provider or the README for the installed major if the app has no usage yet.
3. If a component fails to resolve, clear the view cache before assuming the prefix is wrong.

The same applies to Livewire component prefixes, Filament panel namespaces, and any package that
registers a namespace.

## The map

Entries marked **confirm** are registration-dependent — verify in the app before writing. Entries
without it are the vendor's own syntax, verified from official documentation.

| Detected package | Vendor syntax | Where to confirm |
| --- | --- | --- |
| `livewire/livewire` 4.x | `wire:*` directives; `#[Locked]`, `#[Computed]`, `#[On]`, `#[Validate]`, `#[Url]`; `<livewire:...>`; `Route::livewire()`; `@island`; ⚡-prefixed single-file components | `app/Livewire` (class), `resources/views/livewire` (SFC/MFC), config `make_command.type` |
| `livewire/livewire` 3.x | As above **minus** `Route::livewire()` and `@island`; `make:livewire` produces a class component | — |
| `livewire/volt` | `Volt::route()`, `Volt::test()`, `@volt`; functional helpers `state()`, `computed()`, `action()`, `rules()` | **Only if `livewire/volt` is in `composer.lock`** — absent on Livewire 4, where Volt was absorbed |
| `livewire/flux` | `<flux:*>` components; `Flux::toast()` | **confirm** the prefix by grepping views; versioned docs at `https://fluxui.dev/docs/{page}.md` (index `https://fluxui.dev/llms.txt`) |
| `filament/filament` | `Filament\…` PHP namespaces; a Blade prefix registered per panel | **confirm** — namespaces and schema APIs move between every major |
| `robsontenorio/mary` | 70 Blade components (verified list below) | **confirm** the prefix by grepping views |
| `inertiajs/inertia-laravel` | `Inertia::render()`, `Inertia::defer()`, `@inertia`, `assertInertia()` | `resources/js/pages` |
| `@inertiajs/react` / `vue3` / `svelte` | `useForm()`, `router`, `<Link>`, `usePage()` — import from the **matching** adapter | `package.json` adapter |
| `daisyui` | Semantic class names: `btn`, `card`, `modal`, `bg-primary`, `text-primary-content`, `border-base-300` — class names only, no components | `resources/css/app.css` → `@plugin "daisyui"` |
| `nativephp/mobile` 4.x | `<native:*>` Blade components; `Route::native()`; `NativeComponent` classes; `#[Poll]`, `#[Computed]`, `#[Locked]` | `composer.lock` — **only** the mobile package |
| `nativephp/desktop` 2.x | Electron shell; **no** `native:` UI components (web view UI) | `composer.lock` — never installed alongside mobile |
| `laravel/fortify` | `Features::…`, `Fortify::…`, action classes under `app/Actions/Fortify` | `config/fortify.php` |
| `laravel/sanctum` | `HasApiTokens`, `auth:sanctum`, `tokenCan()` | `config/sanctum.php` |
| `laravel/passport` | `Passport::…`, OAuth2 grants | `config/passport.php` |
| `laravel/pennant` | `Feature::active()`, `Feature::for($user)` | `app/Providers/*` feature definitions |
| `laravel/folio` | Page files under `resources/views/pages` map to URLs — no route registration | the directory itself |
| `laravel/wayfinder` | Generated typed route/controller helpers — import from the generated path | confirm the generated directory before importing |
| `laravel/pulse` | `Pulse::…` recorders and cards | `config/pulse.php` |
| `laravel/horizon` | Mostly config + `horizon` commands; `Horizon::…` for extensions | `config/horizon.php` |
| `laravel/octane` | `Octane::…` for listeners/table bindings | `config/octane.php` |
| `laravel/reverb` | `Broadcast::…` plus Reverb server config | `config/reverb.php` |
| `laravel/nightwatch` | `Nightwatch::…` | `config/nightwatch.php` |
| Laravel core **13 only** | PHP attributes: `#[Middleware]`, `#[Authorize]`, `#[Tries]`, `#[Backoff]`, `#[Timeout]`, `#[FailOnTimeout]` | Not available on 10/11/12 — a fatal error |

### maryUI component names (verified)

The 70 Blade components shipped by `robsontenorio/mary` 2.x, verified from the package's source tree.
Use this to know a component *exists*; confirm the Blade prefix in the app before writing markup.

```
Accordion Alert Avatar Badge Breadcrumbs Button Calendar Card Carousel Chart Checkbox Choices
ChoicesOffline Code Collapse Colorpicker DatePicker DateTime Diff Drawer Dropdown Editor Errors
File Form Group Header Hr Icon ImageGallery ImageLibrary Input Kbd ListItem Loading Main Markdown
Menu MenuItem MenuSeparator MenuSub MenuTitle Modal Nav Pagination Password Pin Popover Progress
ProgressRadial Radio Range Rating Select SelectGroup Signature Spotlight Stat Step Steps Swap
Tab Table Tabs Tags Textarea ThemeToggle TimelineItem Toast Toggle
```

## The general rule

Never write a package prefix from memory. It is one of exactly three things:

1. **In this file** — the vendor's own syntax, verified.
2. **Registration-dependent** — confirm it in the application (grep the existing usage).
3. **Unknown** — fetch the installed major's documentation (`whats-new.md` lists the URLs).

Writing a plausible prefix is the same class of error as writing a plausible column name: it looks
right, it fails at runtime, and it costs a fix iteration. The prefix is a fact about the installed
package and its registration — treat it as one.
