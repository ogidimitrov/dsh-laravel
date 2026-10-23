# dsh-laravel-skills

Version-aware Laravel engineering skills for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): detect the stack first, then apply per-version guidance, SOLID design, and stack-specific playbooks.

28 skills, loaded on demand. Nothing is pinned to a specific Laravel version — each skill resolves the installed version from `composer.lock` (or asks) before it advises, because remembered syntax across majors is how Laravel answers go wrong.

## Install

The plugin is a DeepSeek Harness bundle: a package whose `dsh.bundle.patch` mounts a skill provider.

```bash
# from a registry
dsh plugin --profile desktop add dsh-laravel-skills

# straight from this repository
dsh plugin --profile desktop add github:ogidimitrov/dsh-laravel
```

Then restart the app. The skills appear in the next session's catalog and are invocable by name (`laravel-stack`, `laravel-route`, ...).

<details>
<summary>Manual install (no CLI)</summary>

Add the package to the profile and reinstall its dependencies:

```bash
cd ~/.dsh/profiles/desktop
pnpm add github:ogidimitrov/dsh-laravel
```

The bundle is picked up from the profile's `dsh.profile.bundles`, or you can mount the provider for one run without touching the profile:

```yaml
# extra.yml
- insert:
    - id: laravel-skills
      name: 'dsh-laravel-skills/provider'
```

```bash
dsh --profile desktop --patch ./extra.yml
```

</details>

## What's inside

| Skill | When it applies |
| --- | --- |
| `laravel-alpine` | Add lightweight Alpine.js interactivity without breaking Livewire or inventing state. |
| `laravel-api` | Build secure, versioned Laravel APIs with correct auth, resources, and error contracts. |
| `laravel-blade-livewire` | Build server-driven Laravel UI with Blade, Alpine, and Livewire correctly and efficiently. |
| `laravel-conventions` | Apply idiomatic Laravel conventions and avoid the standard correctness, security, and performance mistakes. |
| `laravel-daisyui` | Use daisyUI components with the official llms.txt index and the correct Tailwind pairing. |
| `laravel-design-decision` | Decide whether a design pattern is warranted before adding structure, and price its overhead. |
| `laravel-filament` | Build Filament admin panels that keep domain logic and authorization in the right layer. |
| `laravel-flux` | Build Livewire UI with Flux components, respecting the free and Pro tiers. |
| `laravel-grill` | Interrogate the plan before writing code, so nothing is written while syntax confidence is missing. |
| `laravel-inertia` | Build Inertia SPA features on Laravel with a correct server/client contract and typed props. |
| `laravel-maryui` | Use maryUI components on the Livewire + Tailwind + daisyUI stack with correct wiring and version pairing. |
| `laravel-nativephp` | Build NativePHP desktop or mobile apps, or assess whether a Laravel app fits the native shell model. |
| `laravel-performance` | Find and fix the Laravel performance problems that actually matter, in order of measured impact. |
| `laravel-project-rules` | Record a durable project rule whenever the user corrects the agent, so the same fix never recurs. |
| `laravel-recon` | Read this app's real schema, routes, models, and config before writing code that must match them. |
| `laravel-review` | Review Laravel changes for version correctness, security, N+1, and convention violations. |
| `laravel-route` | Route a detected Laravel stack to the exact skills and version knowledge that apply, before planning work. |
| `laravel-solid` | Write SOLID, dependency-injected Laravel code without over-abstracting the framework. |
| `laravel-stack` | Detect a Laravel app's framework version, front end, and full stack profile before planning changes. |
| `laravel-stack-forge` | Generate project-scoped Laravel skills from the detected stack so later turns inherit this project's conventions. |
| `laravel-stack-interview` | Ask the user to choose the stack before scaffolding a new Laravel app, or when detection is inconclusive. |
| `laravel-tailwind` | Style Laravel apps with Tailwind CSS, respecting the v3 versus v4 configuration split. |
| `laravel-testing` | Write and run Laravel tests using the project's actual runner, without testing the framework. |
| `laravel-tooling` | Use the project's Laravel tooling - Sail, Pint, Larastan, Rector, Pail, Wayfinder, Pennant, Folio, Dusk. |
| `laravel-update` | Refresh the plugin's version knowledge from primary sources when a new major ships or on a schedule. |
| `laravel-verify` | Verify assumptions and run the cheapest real checks before declaring Laravel work done. |
| `laravel-versions` | Teach what each Laravel and ecosystem version introduced, and resolve version-specific rules before writing code. |
| `laravel-volt` | Write Livewire components in Volt's single-file form, or correctly migrate off Volt on Livewire 4. |

Under `skills/*/references/` sit 14 supporting tables (routing table, version deltas, ecosystem matrix, stack catalog, package syntax map, security checklist, and more). Skills point at them by path; the harness exposes each skill directory as a resource base, so a reference can be read on demand instead of being pasted into the catalog.

## How it works

`lib/provider.js` registers a skill provider on `ctx.skills`:

- `list()` reads `<assetRoot>/<name>/SKILL.md` once and returns catalog summaries - one line per skill, not the body.
- `get(candidate)` re-reads that file and returns the body, so edits are picked up without restarting.
- Rank `600` places the pack above project skills (`100`-`200`) and user skills (`400`-`500`), so a project can still override a bundled skill by reusing its name.
- Invalid frontmatter is skipped with a warning instead of failing the whole bundle.

`cordis.patch.yml` is the composition layer:

```yaml
- insert:
    - id: laravel-skills
      name: 'dsh-laravel-skills/provider'
```

`package.json` points at it through `dsh.bundle.patch`; the package root itself exports nothing.

## Project-scoped skills

`laravel-stack-forge` writes generated skills to `<workspace>/.dsh/skills/<name>/SKILL.md`. The harness scans that root at rank 100, above this bundle, so a forged skill can specialise - or shadow - a bundled one by reusing its bare name.

## Differences from the Reasonix plugin

This pack began as [reasonix-laravel](https://github.com/ogidimitrov/reasonix-laravel), which targets a different agent runtime. The knowledge is unchanged; the wiring is not:

| Reasonix | Here |
| --- | --- |
| `reasonix-plugin.json` (`reasonix.io/plugin/v2`) | `package.json` with `dsh.bundle.patch` |
| `commands/*.md` prompt templates | Dropped. Harness commands run code and do not create a model turn, so each command is a user-invocable skill instead: `/route` -> `laravel-route`, `/new` -> `laravel-stack-interview`, `/stack` -> `laravel-stack`, `/skill` -> `laravel-stack-forge`, `/grill` -> `laravel-grill`. |
| `runAs: inline` / `subagent` | Removed. Every harness skill is inline; invocation is controlled by `user-invocable` and `disable-model-invocation`. |
| `.reasonix/` project state | `.dsh/` |
| `REASONIX.md` folded into the prompt | `AGENTS.md` (the harness loads `AGENTS.md`, and a colocated `CLAUDE.md`) |
| `reasonix mcp add ...` | An `@deepseek-ai/dsh-mcp-client` entry in the profile patch |
| `reasonix doctor capabilities --json` | The skill catalog itself, or `Get-ChildItem $env:DSH_HOME/skills` |

## Development

```bash
npm install
npm test
```

The test suite asserts that every skill directory is discovered, that names are kebab-case and match their directory, that descriptions are present, that bodies resolve through `get()`, and that the patch mounts `./provider`.

## License

MIT. Skill content by [Ognyan Dimitrov](https://github.com/ogidimitrov), ported from `reasonix-laravel`.
