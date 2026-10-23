---
name: laravel-tooling
description: Use the project's Laravel tooling — Sail, Pint, Larastan, Rector, Pail, Wayfinder, Pennant, Folio, Dusk.
---

# Laravel tooling

Applies when the profile shows any of these packages. The governing rule for all of them:
**run the project's configured command, discovered from the repository — never a remembered
default.**

## Discover the real commands first

```bash
composer run                      # list the project's script aliases
php artisan list                  # every artisan command available in this app
php artisan list <filter>         # e.g. php artisan list wayfinder
```

A project's `composer.json` → `scripts` is authoritative. If it defines `test:unit` or `lint`,
that is the command — not `php artisan test` or `vendor/bin/pint` bare.

## Sail

If `laravel/sail` is installed (latest 1.68.0), the application almost certainly runs in
containers, and **the host may have no PHP at all**, or a different PHP version than the app
targets.

| Instead of | Use |
| --- | --- |
| `php artisan …` | `sail artisan …` |
| `composer …` | `sail composer …` |
| `npm …` | `sail npm …` |
| `vendor/bin/phpunit` | `sail test` (or `sail artisan test`) |
| MySQL/Postgres on localhost | the Sail container host/port from `.env` |

Getting this wrong produces confusing failures (missing extensions, wrong PHP version, connection
refused) that look like application bugs. Check for `docker-compose.yml` / `compose.yaml` and
`vendor/bin/sail` before running anything.

## Pint (formatting)

- Run before declaring work done: `vendor/bin/pint --dirty` (only changed files) or the
  project's lint script.
- Respect the project's `pint.json` preset. Do not reformat the whole repository as a side
  effect of a feature change — that buries the real diff.
- Do not hand-format around Pint's output; if a construct is unreadable after formatting, the
  construct is the problem.

## Larastan / PHPStan (static analysis)

- Run at the level the project configures (`phpstan.neon`). Do not unilaterally raise or lower
  the level in an unrelated change.
- **Do not add `ignoreErrors` entries to silence new findings.** Fix the issue, or raise it
  explicitly with the user. A new baseline entry hides a real defect.
- Prefer precise types over `mixed`; use Laravel-aware generics (`Collection<int, Invoice>`,
  `LengthAwarePaginator<Invoice>`) where the codebase already does.
- Scope the run to the paths you touched when the full run is slow, but report if the full
  analysis was not run.

## Rector (automated refactoring)

- **Always dry-run first**: `vendor/bin/rector process --dry-run`.
- Use the project's `rector.php` rule sets. Do not add rule sets in the middle of a feature
  change.
- Review the diff before applying. Rector is mechanical and will happily rewrite code you did
  not intend to touch, including in unrelated files.
- Automated upgrades (`driftingly/rector-laravel`, latest 2.6.2, requires PHP `>=8.3`) belong in
  a dedicated upgrade change, not a feature branch.

## Pail (log viewer)

Development-time log tailing (`laravel/pail`). Not a production observability tool. If the task
is "why is this failing in production", read the configured log channel and the ingestion
pipeline — do not assume Pail's presence.

## Wayfinder (typed route helpers)

If `laravel/wayfinder` is installed (latest 0.1.21, PHP `^8.2`), it generates typed
route/controller helpers for the client side.

- **Use the generated helpers** instead of hand-written URL strings. That is the entire point,
  and hand-written URLs silently break when a route changes.
- Regenerate after changing routes (confirm the command with `php artisan list wayfinder` — the
  generator name can differ from the package name).
- Generated files are build artifacts: do not hand-edit them, and do not commit conflicts in them.

## Pennant (feature flags)

- Define features in a service provider (`Feature::define(...)`), not inline at call sites.
- Check flags with `Feature::active()` / `Feature::for($user)->active()`; scope to the user model
  the project uses.
- **Never use a feature flag as an authorization control.** Flags are rollout mechanics; they are
  not policy. A disabled flag must not be the only thing preventing access to privileged data —
  use a policy or gate. This is the most dangerous Pennant misuse.
- Do not leave a flag checked in a hot loop; resolve once per request.
- When a rollout completes, remove the flag and both branches rather than leaving dead code.

## Folio (file-based routing)

- Pages live under `resources/views/pages` and map to URLs by filename.
- **It coexists with `routes/web.php`.** Before adding a route, check both — a Folio page and a
  route file can define the same path, and the resolution may not be what you expect.
- Do not mix paradigms inside one feature; pick the mechanism the surrounding pages already use.

## Dusk (browser tests)

- Needs a running application and a browser driver. Slow and more flaky than feature tests.
- Use it for genuinely browser-bound behaviour (JS interactions, file uploads, multi-step
  client flows) — not as a substitute for feature tests, which cover most Laravel behaviour
  faster and more reliably.
- Do not add Dusk to a project that does not already use it as a drive-by; propose it instead.

## MCP

DSH connects to MCP servers by mounting `@deepseek-ai/dsh-mcp-client` in the profile patch, one
entry per server.

- A Laravel app can expose its own MCP server; wire it as a `dsh-mcp-client` entry and prefer project
  scope for app-specific servers. Never inline secrets — use `${VAR}` placeholders in headers/env.
- `laravel/boost` (v2.10.0) provides Laravel's official MCP server (`php artisan boost:mcp`) with
  application info, DB schema/query, log, and version-filtered docs tools. **This plugin does not
  require Boost** — but if a project already has it, its tools are a strong complement, and the
  stack profile should record its presence.
- **Context7** (`@upstash/context7-mcp` 4.1.1) extends doc lookup to the long tail of libraries this
  plugin deliberately does not cover. Wire it with:
  ```yaml
  - id: mcp-context7
    name: '@deepseek-ai/dsh-mcp-client'
    config:
      serverName: context7
      transport: stdio
      command: npx
      args: ['-y', '@upstash/context7-mcp']
  ```
  Treat its output as a **secondary** source: it is derived from each project's own docs, it is not
  `llms.txt` format, and its version selection is topic-based rather than path-based. Prefer the
  upstream version-scoped docs for the installed version. See
  `laravel-versions/references/ecosystem-matrix.md` → *Third-party corpora*.
- An MCP server that shells into the app must be pointed at the right runtime (Sail vs host PHP).
  A server configured with bare `php` in a Sail project will fail or use the wrong version.

## Review checklist

- [ ] Commands taken from `composer.json` scripts / `php artisan list`, not memory
- [ ] Sail used for every command when Sail is installed
- [ ] Formatter run, scoped to changed files
- [ ] Static analysis run at the project's level, with no new ignores added
- [ ] Rector dry-run reviewed before applying, if used
- [ ] Wayfinder helpers regenerated/used rather than hand-written URLs
- [ ] Feature flags not used as authorization; completed rollouts cleaned up
- [ ] Both Folio pages and route files checked before adding a route
- [ ] MCP servers use the project's runtime and `${VAR}` for secrets
