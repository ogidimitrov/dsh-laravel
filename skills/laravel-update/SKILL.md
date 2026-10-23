---
name: laravel-update
description: Refresh the plugin's version knowledge from primary sources when a new major ships or on a schedule.
---

# The research and update loop

This plugin's value is that its embedded knowledge is **current and verified**. That is a property
you have to maintain, not one that holds on its own. This skill is the maintenance loop, written so
an agent can execute it end to end.

**On scheduling, plainly:** the plugin cannot schedule itself — it is a repository, not a daemon.
"Scheduled" means *you* run this skill on a cadence: a cron job that invokes the agent, a CI job, a
calendar reminder, or simply asking for it. The procedure below is what makes that a five-minute
task instead of an open-ended research project.

## When to run

| Trigger | Why |
| --- | --- |
| A Laravel, Livewire, Tailwind, Filament, Pest, Inertia, daisyUI, NativePHP or maryUI **major** shipped | Layer-2 knowledge is now wrong or incomplete |
| **Quarterly**, as a floor | Catches minor drift and dead doc URLs |
| A support window closes (an EOL date passes) | The support table becomes misleading |
| A fetch fails or a doc page moved | The pointers are part of the knowledge |
| DSH upgraded | The bundle and skill-frontmatter contracts may have changed |
| Before starting on an unfamiliar stack | Confirms the guidance for that stack is still true |

## The loop

### 1. Re-resolve the version matrix

```powershell
# PHP packages
Invoke-RestMethod "https://packagist.org/packages/<vendor>/<pkg>.json" |
  ForEach-Object { $_.package.versions.PSObject.Properties.Name } | Select-Object -First 20

# JS packages
Invoke-RestMethod "https://registry.npmjs.org/<pkg>/latest" | Select-Object version
```

Cover every package listed in `laravel-versions/references/ecosystem-matrix.md`. Record the top
stable version and the `require.php` / engine constraint for each.

### 2. Diff against the matrix

Compare to `ecosystem-matrix.md` and list **only the differences**: new majors (add), new minors
(usually ignore — see the layering rule), changed PHP floors (important), new support bands.

A new *major* is the significant event. A new *minor* is normally **not** worth recording.

### 3. Re-fetch the major sources

For each ecosystem whose major moved:

| Source | Use |
| --- | --- |
| `https://raw.githubusercontent.com/laravel/docs/{x}.x/releases.md` | Laravel "what's new" + support table |
| `https://raw.githubusercontent.com/laravel/docs/{x}.x/upgrade.md` | Laravel breaking changes |
| `https://raw.githubusercontent.com/laravel/docs/{x}.x/deployment.md` | Optimize/deploy guidance |
| `https://filamentphp.com/docs/llms.txt` | Filament page index + version |
| `https://daisyui.com/llms.txt` | daisyUI components + declared version |
| The project's own GitHub releases / CHANGELOG | Livewire, Tailwind, Inertia, Pest, NativePHP, maryUI |

Update `whats-new.md` (what exists now) and `version-deltas.md` (what broke).

### 4. Verify the pointers — by **content**, not status code

The fetch URLs across `whats-new.md`, `ecosystem-matrix.md`, and `syntax-by-version.md` are
load-bearing. A dead or silently aliased pointer is worse than no pointer, because the skill presents
it as authoritative.

**Never trust a 200.** Single-page-app docs sites return `200` with their HTML shell for *any* path,
so an `llms.txt` URL can appear to exist while returning a documentation page. This produced two
confirmed false positives on livewire and alpine. For every `llms.txt`, confirm the body starts with
an H1 and a blockquote summary:

```powershell
$r = Invoke-WebRequest "https://<host>/llms.txt" -UseBasicParsing
if ($r.Content -match '^#\s') { "real llms.txt" } else { "HTML fallback — treat as ABSENT" }
```

Then re-check the version-scoped markdown pages, and that they still **differ between majors** (that
difference is the proof the versioning is real):

```
https://laravel.com/framework/docs/{x}.x/{page}.md      # 13.x vs 12.x must differ
https://filamentphp.com/docs/{x}.x/{path}.md
https://fluxui.dev/docs/{page}.md
```

Also re-probe for **newly published surfaces** each pass — this is where the inventory grows. Known
real ones, re-confirm all:

| Surface | Expect |
| --- | --- |
| `https://daisyui.com/llms.txt` | H1 + self-declared version |
| `https://filamentphp.com/docs/llms.txt` | versioned page index |
| `https://pestphp.com/llms.txt` · `/llms-full.txt` | real llms.txt (index + full docs) |
| `https://fluxui.dev/llms.txt` | real llms.txt (per-page `.md` links) |
| `livewire.laravel.com/docs/llms.txt` · `alpinejs.dev/llms.txt` | **HTML — must stay recorded as absent** |
| `https://context7.com/{org}/{repo}/llms.txt` | 200 with Context7's **own** text format, not `llms.txt`. Re-confirm it is still a fallback and still secondary — it must never outrank an upstream source for the installed version |

Also re-check the **Context7 MCP package**, which is how the long tail stays reachable without this
plugin maintaining 30 packages:

```powershell
Invoke-RestMethod "https://registry.npmjs.org/@upstash/context7-mcp/latest" | Select-Object version
```

Finally, re-check the repository AI files that are worth knowing about, and keep the classification
honest: `AGENTS.md`/`CLAUDE.md` in `filamentphp/filament`, `pestphp/pest`, `livewire/livewire`, and
`alpinejs/alpine` are **contribution** guidance for working on those libraries, not guidance for
building applications with them. Do not promote them to app guidance.

### 5. Re-probe the DSH contract (on a DSH upgrade)

```powershell
dsh --version
Get-ChildItem $env:DSH_HOME/skills        # every shipped skill should be listed
```

Confirm the accepted manifest fields and the skill frontmatter contract still hold. Test against an
isolated `DSH_HOME` to avoid touching the real one.

### 6. Prune — this step is not optional

An update that only adds is how this plugin dies. Every update must remove:

- Sections for versions now EOL **and** not worth supporting.
- Claims the new docs contradict.
- `whats-new.md` entries for a major that is no longer current or previous.
- Any item that cannot change a line of code — if it cannot, it was never knowledge, it was prose.

### 7. Validate the mechanical invariants

These are cheap, deterministic, and easy to break. Run them every pass — they are what keeps 28
skills and 14 references coherent after edits:

- [ ] Every `skills/<name>/SKILL.md` parses, and its frontmatter `name` **equals its directory name**
- [ ] Every `description` is non-empty and **≤ 120 chars** (a self-imposed limit)
- [ ] Any `user-invocable` / `disable-model-invocation` value is a boolean, not a quoted string
- [ ] **No UTF-8 BOM** on any file — a BOM before `---` breaks frontmatter parsing
- [ ] Every reference file **starts with a heading**, and is **pointed at** from some skill
- [ ] Every skill is **named in `routing-table.md`** (no unroutable skill)
- [ ] No skill is orphaned (referenced nowhere outside itself)
- [ ] The README's claimed **skill and reference counts** match reality
- [ ] The new `version` is bumped **and reflected in the README**
- [ ] All 28 skills load: each `<name>/SKILL.md` has a kebab-case `name` and a `description`
- [ ] The bundle mounts without error in an **isolated `DSH_HOME`** so the real one is untouched

A JSON/markdown linter will not catch the BOM, the count drift, or the routing gap — which is
precisely why they are listed.

### 8. Re-measure and refresh the numbers

The README quotes token counts and costs. Re-measure with the pinned tokenizer and update:

- the fixed index (skills + commands entries)
- a typical task (skills + the common reference)
- the absolute worst case
- the DeepSeek cost rows

Stale numbers in the README are the same defect as a stale version claim.

### 9. Bump the version and report

Increment `version` in `package.json` (minor for knowledge refresh, major for a structural
change). Then report, briefly:

```markdown
## Update <date>

Matrix drift:   Laravel 13.34 → 13.41 · Filament 5.9 → 5.12 · no new majors
New majors:     none
EOL:            Laravel 12 bug-fix window confirmed closed
Docs moved:     none — all pointers 200
Pruned:         1 stale claim (Pest 4 guidance superseded)
Overhead:       index 694 → 698 tok · typical 17.2k → 17.2k
Version:        1.6.0 → 1.6.1
```

## The detail rule

The goal is the **latest correct, specific, actionable knowledge** — not the least text. Under
DeepSeek's prefix cache, loaded context is roughly **50× cheaper** than fresh context, and output
costs ~200× a cached-hit input token. So token count is not the constraint; **iterations and round
trips are.**

Every addition must pass one test:

> **Can this change a line of code, or prevent a fix iteration?** If not, it does not belong.

| Add | Do not add |
| --- | --- |
| A version's breaking changes | A version's full changelog |
| A new API that changes how a task is done | Every new method in a minor |
| A constraint that silently fails (Tailwind 3 syntax in v4) | Style preferences |
| The correct prefix/namespace for a detected package | A paraphrase of the package's README |
| Support status and PHP floors | Historical release trivia |
| A pointer to the authoritative source | A restatement of that source |

Sizes to know, not to enforce:

| Artefact | Guidance |
| --- | --- |
| Skill body | As long as its decisions require. **No cap** — an unstated rule costs an iteration; an extra paragraph costs almost nothing when cached |
| Reference file | Split by **decision** (a different reason to load it), never by size |
| Fixed index | ~1,000 tokens — the one place to stay lean, since it is paid every request and competes for attention |

**Depth belongs behind a pointer only when it is derivable there.** The version-scoped `.md` docs
exist so the plugin need not reproduce the manual, and a smaller surface is a smaller thing to
re-verify. But a version gate, a prohibition, or a prefix belongs *in the body*, because that is what
prevents the iteration.

**Pruning is about staleness and redundancy, not length.** An update that only adds is how a
knowledge plugin dies — but so is one that cuts version gates to hit a line count. Remove what is
contradicted, superseded, or duplicated; keep what changes a line of code.

## Checklist

- [ ] Every package in the matrix re-resolved from Packagist / npm
- [ ] Drift listed: new majors, changed PHP floors, changed support bands
- [ ] Major sources re-fetched; `whats-new.md` and `version-deltas.md` updated
- [ ] Support table and the named-arguments note re-verified
- [ ] Every fetch pointer confirmed live
- [ ] DSH contract re-probed (if DSH changed)
- [ ] **Pruned** superseded or contradicted content — not only added
- [ ] Cost numbers re-measured for the README (as information, not a constraint)
- [ ] Plugin version bumped; report written
- [ ] No minor/patch noise recorded
