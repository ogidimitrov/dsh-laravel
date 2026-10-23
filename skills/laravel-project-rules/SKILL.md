---
name: laravel-project-rules
description: Record a durable project rule whenever the user corrects the agent, so the same fix never recurs.
---

# Turn corrections into permanent prevention

Every other mechanism in this plugin prevents mistakes *in advance* from knowledge. This one is the
only mechanism that **compounds**: it converts an iteration already spent into a rule that stops it
recurring.

Run it immediately after a human correction, or when you catch yourself repeating a mistake.

## When to record a rule

| Trigger | Example |
| --- | --- |
| The user corrected your code | "we never use `$request->all()` here" |
| The user rejected an approach | "don't add a repository for this — use the existing Action" |
| You repeated a mistake you already made in this project | the same wrong route name twice |
| A convention was made explicit | "money is always minor units, integer columns" |
| A deliberate deviation from the default was agreed | "we pin Tailwind 3 because the host's build is old" |
| Something non-obvious was explained | "the `status` column is a string enum, not a database enum" |

Do **not** record:
- Anything discoverable by reading the app — schema, routes, config, class names. That is
  `laravel-recon`'s job, and duplicating it here guarantees drift.
- Hypotheticals, style preferences nobody stated, or generic Laravel advice.
- A workaround for a bug without saying it is a workaround.

**Test before writing a rule:** could a future agent learn this by reading the repository? If yes,
do not write it — write a pointer to where to look instead. Rules are for intent, decisions, past
mistakes, and reasons: the things a repository cannot tell you.

## Where rules live

Two surfaces, different trade-offs:

| Surface | Cost | Use for |
| --- | --- | --- |
| `.dsh/skills/<project>-project-rules/SKILL.md` | on demand | The default. Loaded when relevant, no permanent context cost |
| The project's `AGENTS.md` | always on (cache-stable prefix) | Only for the few rules that must never be violated, whatever the task |

DSH loads `AGENTS.md` (and a colocated `CLAUDE.md`) into the system prompt at session boot —
that is the native equivalent of an always-applied rules file. Keep anything there to a handful of
lines; the system prefix is paid on every request.

Prefer the project-skill surface, and only promote a rule into `AGENTS.md` when its violation is
both likely and costly.

## Rule format

```markdown
## Project rules (this app)

- **Never pass `$request->all()` into `create()`/`update()`.** `status` and `tenant_id` are
  fillable here. Use `$request->validated()`.
  *From a correction, 2026-09-30. Prevents: silent privilege escalation.*
- **Money is always stored as an integer of minor units** (`price_cents`), never a float.
  Use the `Money` cast; do not add `decimal` columns.
  *From a correction, 2026-09-30. Prevents: rounding drift in invoices.*
- **All writes go through an Action class** in `app/Actions`. No model saving from controllers.
  *From a rejected approach, 2026-09-30.*
- **Do not add a repository layer.** Eloquent is the data-access layer here; this was proposed and
  rejected.
  *From a rejected approach, 2026-09-30. Prevents: re-proposing it every session.*
```

Each rule must name **the failure it prevents**. A rule that only states a preference is not
checkable and will be skimmed past.

## Quality bar

A rule earns its place only if all four hold:

1. It came from a real event, not a hypothetical.
2. It is specific and checkable against a diff.
3. It names the failure it prevents.
4. It is scoped to this project — not general Laravel advice.

Reject the rest. A rules file full of vague guidance is worse than none: it dilutes the rules that
matter, and it teaches future agents to skim.

## Keep it small, or it stops being read

- **Prune on every edit.** When a rule becomes moot — the feature was removed, the version was
  upgraded, the convention changed — delete it. Stale rules actively mislead.
- **Cap the size.** If the file grows past roughly 150 lines, it is no longer a rules file; cluster
  the area-specific rules into proper project skills with `laravel-stack-forge` and keep only the
  cross-cutting ones.
- **Re-verify after a version upgrade.** A rule that encoded a workaround for an old version is
  often wrong on the new one.
- **Version-control the rules file.** It belongs in the repository, so the whole team's agents
  inherit it.

## Reporting

After recording, state: which rule was added, the event that produced it, and what it prevents —
in one or two lines. Do not pad it. If nothing met the quality bar, say that explicitly instead of
recording a weak rule.

## Checklist

- [ ] The rule came from a real correction or a repeated self-observed mistake
- [ ] It is not something the repository already answers (else it points to where to look)
- [ ] It is specific, checkable, and names the failure it prevents
- [ ] It is scoped to this project
- [ ] Obsolete rules were pruned in the same edit
- [ ] Stored in the project (not global), so the team shares it
- [ ] The file is still small enough to be read
