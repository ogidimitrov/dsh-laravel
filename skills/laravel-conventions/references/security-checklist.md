# Security checklist

An auditable list for `laravel-conventions`. Work down it for any change that touches
authentication, authorization, input, uploads, or output. Each item names the failure it prevents.

## Authentication and session

- [ ] Passwords hashed with the configured hasher (bcrypt/argon2i/argon2id) — never MD5/SHA, never
      reversible, never logged
- [ ] Login, registration, password reset, and OTP endpoints are **rate limited**
- [ ] Session regenerated on login and invalidated on logout (Laravel does this — do not work around it)
- [ ] Session cookie is `secure`, `httpOnly`, and `sameSite` is set deliberately
- [ ] Session driver works across all nodes (`file` does not scale horizontally; use Redis/database)
- [ ] Idle and absolute session timeouts are deliberate
- [ ] Two-factor / passkey support where the risk justifies it (Fortify provides the primitives)
- [ ] Remember-me tokens are treated as credentials (revocable, per-device)
- [ ] API tokens have a defined expiry and a revocation path; no permanent tokens

## Authorization — the highest-yield section

- [ ] **Every** model operation has a policy or gate; a model with no policy exposed to users is a
      finding, not an omission
- [ ] Authorization is enforced **server-side**, in the controller/action — never only by hiding UI
      (`@can`, a hidden button, or a Filament `->visible()` are presentation)
- [ ] **IDOR:** any route-model-bound resource is checked for ownership/tenant, not just existence
- [ ] Nested bindings use `->scopeBindings()` so a child cannot be accessed through an unrelated parent
- [ ] Multi-tenant isolation is enforced in **queries** (global scope / explicit scoping), not by the
      tenant switcher in the UI
- [ ] Client-supplied IDs are never trusted for ownership, role, or status
- [ ] `401` for unauthenticated, `403` for authenticated-but-forbidden — never reversed
- [ ] Admin/privileged routes require an explicit role check, not merely authentication
- [ ] Policies are tested for the negative case (unrelated user → 403/404)

## Input

- [ ] Validation happens in a **Form Request** (or equivalent) for every non-trivial payload
- [ ] Only `validated()` data reaches `create()`/`update()` — never `$request->all()`
- [ ] Mass assignment is explicit: deliberate `$fillable`, or a guarded `$guarded`. No global
      `Model::unguard()`
- [ ] Privileged columns (`is_admin`, `role_id`, `status`, `tenant_id`, `user_id`) are **not**
      client-fillable unless deliberately so
- [ ] **SQL injection:** all raw SQL uses bindings; no interpolated variables. `orderBy`/`sort`/
      `filter` inputs map through an allowlist
- [ ] **SSRF:** if the server fetches a user-supplied URL, the scheme and host are allowlisted and
      private/link-local ranges are blocked (including cloud metadata endpoints such as
      `169.254.169.254`)
- [ ] **File uploads:** mime/extension/size allowlist; stored outside the webroot or served through
      a controller; client filename never trusted; stored SVG treated as untrusted markup
      (Laravel 12+ excludes SVG from image validation by default — do not re-add it casually)
- [ ] **Deserialization:** `unserialize()` is never applied to user input; on Laravel 13 review the
      cache `serializable_classes` configuration
- [ ] No dynamic class instantiation, `eval`, or shell interpolation from user input
- [ ] Array/JSON inputs are bounded (max items, max depth) to prevent resource exhaustion

## Output

- [ ] Blade `{{ }}` (escaped) by default; `{!! !!}` only for content you generated or sanitized
- [ ] Inertia/React `dangerouslySetInnerHTML`, Vue `v-html`, and Alpine `x-html` are never fed
      user-controlled content
- [ ] JSON responses use API Resources or explicit arrays — never raw Eloquent models
- [ ] Download filenames and `Content-Type` headers are not built from unsanitized input
- [ ] Security headers are set: `Content-Security-Policy`, `Strict-Transport-Security`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a frame policy
- [ ] Errors in production are generic: no stack traces, SQL, file paths, or framework versions
- [ ] `404` and `403` do not disclose the existence of private resources

## Request forgery

- [ ] CSRF protection is active on all state-changing routes; not disabled for an SPA
- [ ] **Laravel 13 changed this:** request forgery protection was enhanced and formalized as
      `PreventRequestForgery` with origin-aware verification. On upgrade, review any custom CSRF
      configuration and all state-changing endpoints
- [ ] Cookie-authenticated SPA routes use the stateful API configuration, not bare token auth

## Rate limiting and abuse

- [ ] `RateLimiter::for()` covers auth endpoints, writes, and anything expensive
- [ ] Limits are per-user/per-token for authenticated routes and per-IP for anonymous ones
- [ ] `per_page` is capped and `?include=` is an allowlist — unbounded input is a DoS vector
- [ ] Search endpoints back onto bounded queries (no leading-wildcard scans over huge tables)

## Secrets and configuration

- [ ] `.env` is never committed; `.env.example` carries keys with dummy values
- [ ] `APP_KEY` is present, and rotated if it may have leaked (it decrypts all encrypted data)
- [ ] `APP_DEBUG=false` in production — debug pages leak configuration and credentials
- [ ] No secrets in logs, error responses, Inertia props, or front-end bundles
- [ ] `env()` is called only inside `config/` (else it returns `null` under config caching)
- [ ] Config is cached in production (`php artisan optimize`)

## Dependencies and supply chain

- [ ] `composer audit` runs in CI and its findings are triaged
- [ ] Lock files are committed and respected
- [ ] PHP and Laravel versions are **within support** — an EOL release receives no security fixes
      (see `laravel-versions/references/versioning-model.md`)
- [ ] Abandoned/unmaintained packages are identified rather than inherited
- [ ] Node dependencies are audited too (`npm audit`) and the build output is not served stale

## Operations

- [ ] HTTPS everywhere, with HSTS; HTTP redirects to HTTPS
- [ ] Private downloads use signed, expiring URLs rather than guessable paths
- [ ] The database user is least-privilege (no `DROP`/`GRANT` for the app user)
- [ ] Backups exist **and a restore has been tested** — an untested backup is a hypothesis
- [ ] Privileged actions are audit-logged (who, what, when) with the actor identity
- [ ] Queue and scheduler dashboards (Horizon, Pulse) are behind authentication and not public

## Commonly wrong by default

| Default | Why it is a finding |
| --- | --- |
| No policy for an exposed model | Authentication is not authorization |
| `$guarded = []` | Mass-assignment vulnerability across every writable column |
| `env()` in application code | Silently `null` under config caching in production |
| Validation only in the client | Trivially bypassed with any HTTP client |
| `?sort=` straight into `orderBy` | Injection-adjacent and a forced table scan |
| SVG accepted as an image | Stored XSS in any origin that renders it inline |
| Debug mode on in production | Leaks credentials and configuration |
| A permanent API token | Credential with no revocation or expiry path |
| Public Horizon/Pulse/Telescope | Operational data exposed to anyone who guesses the path |
