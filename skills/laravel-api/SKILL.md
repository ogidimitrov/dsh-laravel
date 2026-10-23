---
name: laravel-api
description: Build secure, versioned Laravel APIs with correct auth, resources, and error contracts.
---

# Laravel API surfaces

Applies when the app exposes `routes/api.php`, Sanctum/Passport, or serves a separate client.
Laravel 11+ requires `php artisan install:api` for the API routes to exist at all.

## Choose the auth mechanism by consumer

| Consumer | Mechanism |
| --- | --- |
| First-party SPA on the same domain | Sanctum SPA cookie auth (`statefulApi()`) + CSRF |
| First-party mobile app / CLI | Sanctum personal access tokens |
| Third-party / partner integrators | Passport (OAuth2) or sanctum tokens with scoped abilities |
| Server-to-server, no user context | Signed requests or mTLS, not user tokens |

Do not use Passport for a first-party SPA. Do not roll custom token auth.

- Token abilities (`tokenCan`) are authorization claims — check them, don't just check for
  "is authenticated".
- `401` = no/invalid authentication. `403` = authenticated but not permitted. Getting this
  backwards breaks clients and leaks nothing useful.
- Sanctum token expiry and revocation must be deliberate; a token with no expiry is a
  permanent credential.

## Version the surface

- Prefix from day one (`/api/v1/...`) even if you never ship a v2. Retrofitting versioning
  is a breaking change for every consumer.
- Never change the shape, meaning, or status code of an existing field in a shipped version.
  Add fields, deprecate with a documented window, then remove in a new major.
- Register API routes in the version-appropriate place and keep `routes/api.php` thin.

## Resources are the response contract

- **Every endpoint returns an API Resource or an explicit array.** Never return an Eloquent
  model directly — that silently exposes every column and couples the DB schema to the API.
- Control output field by field (`$this->when()`, `whenHas`, `whenLoaded`). `whenLoaded`
  prevents accidental N+1 when a relation wasn't eager-loaded.
- Serialize dates in a single, documented format across the whole API. Mixed formats are a
  client-side bug generator.
- **Never expose `password`, tokens, internal flags, or another tenant's identifiers.**

```php
final class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'number'     => $this->number,
            'total_cents'=> $this->total_cents,     // integers for money, not floats
            'customer'   => new CustomerResource($this->whenLoaded('customer')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

Laravel 13 adds built-in JSON:API resource support; if the profile is 13 and the project
follows JSON:API, prefer the framework's implementation over a hand-rolled serializer.

## Input handling

- **Form Requests for every write endpoint.** No inline `$request->validate()` on a
  non-trivial payload, and never trust `$request->all()`.
- Errors return `422` with a consistent structure. Inertia/SPA clients and API clients
  should not need two error parsers.
- **Filtering/sorting allowlists are mandatory.** `->orderBy($request->input('sort'))` is SQL
  injection-adjacent and lets clients force unindexed sorts. Map to an explicit allowlist.
- **Do not allow arbitrary relation loading** from an `?include=` parameter. Allowlist the
  includable relations and eager-load only those — otherwise a client can trigger expensive
  or private relations.
- Bound `per_page` and every collection endpoint. Unbounded lists are a denial-of-service vector.

## Cross-cutting concerns

- **Rate limit** with `RateLimiter::for(...)`: per-token/per-user for authenticated routes,
  per-IP for auth endpoints. Login, registration, password reset, and OTP always need limits.
- **Idempotency** for unsafe operations clients will retry (payments, provisioning): accept an
  idempotency key and return the original result on replay.
- **Pagination** on every collection; prefer cursor pagination for large, changing datasets.
- **CORS** must be configured explicitly per origin — never wildcard with credentials.
- **Consistent errors:** one error body shape, no stack traces, no SQL, no internal paths in
  production. Log the detail, return a correlation id.
- **N+1 discipline** matters more here than anywhere: an API is called in loops by clients.

## Octane

If `laravel/octane` is present, long-lived workers change the rules:

- No mutable static/singleton state carried across requests; reset anything request-scoped.
- Container singletons that captured request data are the classic Octane data-leak bug —
  bind request-scoped dependencies per request, not as singletons.
- Test under Octane before shipping, not after.

## Documentation

If the project maintains an OpenAPI spec, update it in the same change as the endpoint.
Adding an endpoint without updating the spec is an incomplete change.

## Testing

- Feature tests per endpoint: success, validation failure (`422`), unauthenticated (`401`),
  unauthorized (`403`), and not-found (`404`).
- Assert the response shape (`assertJsonStructure`) so contract drift is caught.
- Assert that another user's resource is `404`/`403` — IDOR is the most common API vulnerability.
- Assert rate limiting on the auth endpoints.

## Review checklist

- [ ] Auth mechanism matches the consumer; abilities checked
- [ ] Resources used — no raw models in responses
- [ ] Form Requests on writes; `422` shape consistent
- [ ] Sort/filter/include allowlists; `per_page` bounded
- [ ] Rate limiting on all endpoints, hard limits on auth
- [ ] Versioned, additive-only changes within a version
- [ ] IDOR covered by tests (other tenant/user → 404/403)
- [ ] Octane-safe state if Octane is installed
