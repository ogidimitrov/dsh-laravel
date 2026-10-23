---
name: laravel-stack-forge
description: Generate project-scoped Laravel skills from the detected stack so later turns inherit this project's conventions.
---

# Forge stack-specific skills for this project

A general Laravel skill cannot know that *this* project puts money in `price_cents`, names
actions `app/Actions`, or that its Livewire components must call `Billing::authorize()`. This
skill turns the verified stack profile into small, project-scoped skills that later turns
load automatically.

**Precondition:** run `laravel-stack`, then `laravel-route`. Forging from assumptions produces
confidently wrong skills, which are worse than no skills. A forged skill should **specialise a
routed skill**, not replace it — route first so you know which general skill you are sharpening.

## 1. Read the profile

Read `.dsh/laravel-stack.md`. If it is missing, stop and run `laravel-stack` — do not
infer the stack inside this skill. If the profile is stale (versions no longer match
`composer.lock`), refresh it first.

## 2. Choose what to forge

Forge a skill only where the project has a **real, non-obvious convention** that a general
skill would get wrong. Use this coverage matrix; skip rows with nothing project-specific.

| Candidate skill | Forge it when the project... |
| --- | --- |
| `<stack>-domain` | has core domain nouns with invariants worth stating up front |
| `<stack>-data` | has money/date/enum/JSON conventions, a naming scheme, or a shared model base |
| `<stack>-ui` | has a chosen front end with its own directory, state, and component conventions |
| `<stack>-admin` | has a panel whose resources must delegate to specific actions |
| `<stack>-api` | exposes external consumers with a fixed response/versioning contract |
| `<stack>-testing` | has a runner, fixtures, or a non-default test database |
| `<stack>-ops` | has deploy, queue, cache, scheduler, or Octane specifics that change code |
| `<stack>-glossary` | uses domain vocabulary that maps to non-obvious class names |

Do **not** forge:
- A restatement of a plugin skill that already covers it (`laravel-conventions`,
  `laravel-solid`, `laravel-versions` already apply — only add a skill for the *delta*).
- A skill whose content you cannot source from files in this repository.
- More than ~6 skills. A large forged skill set is not read; it is a liability.

## 3. Source every claim from the repository

For each forged skill, gather evidence before writing:

- **Paths that exist** — `ls app/`, `ls resources/`, `ls app/Filament/`. Never reference a
  directory you did not see.
- **Real commands** — read `composer.json` → `scripts`, and any `Makefile`/`Taskfile`. Copy
  the actual command string; do not invent `composer test` if the project defines `test:unit`.
- **Real conventions** — read 2–3 representative existing files per area (a model, a
  controller, an action, a test) and derive the pattern from them.
- **Real boundaries** — the interfaces the project already injects, and the services it
  already fakes in tests.

If a claim is not supported by a file you read, either cite the file or leave the claim out.

## 4. Write the skill

Write to `<workspace>/.dsh/skills/<name>/SKILL.md`. Project scope wins over plugin and
global skills of the same bare name, which is exactly what makes a forged skill able to
specialise a plugin skill.

The frontmatter contract (verified against DSH 0.2.1):

```markdown
---
name: laravel-billing-domain        # kebab-case; must be unique
description: One line, <= 120 chars, that says when to load this skill.  # required
user-invocable: true                # optional; false hides it from the human
disable-model-invocation: false     # optional; true stops model auto-selection
---
```

`description` is not optional - without it DSH skips the skill with a warning and
the skill is far less likely to be selected. Write it as a trigger, not a title: state the
task shape that should invoke it, and mention the project so it does not shadow a generic
skill in another repo.

Keep the body small and operational — target 40–120 lines:

```markdown
# <Project> <area> conventions

## Applies when
<the task shapes this covers>

## Stack facts (verified <date>, from composer.lock)
Laravel <ver> · PHP <ver> · <front end> · <admin> · <runner>

## Non-obvious rules
- <rule> — because <reason>; see `<path/to/reference/file>`
- ...

## Canonical examples
```php
// <path/to/real/file.php> — the pattern to copy
```

## Commands
```bash
<the project's actual command, copied from composer.json scripts>
```

## Before finishing
- [ ] <project-specific check that general skills would not know>
```

Rules that keep a forged skill from becoming a liability:
- **Every path and command must be real.** Wrong paths in a skill are worse than no skill:
  a later agent will trust them and thrash.
- **State the verified date and version.** The skill must be re-checkable when the app upgrades.
- **Prefer rules that are non-obvious.** Omit anything the general Laravel skills already say.
- **Do not restate the framework.** A forged skill should be short precisely because the
  general skills are loaded alongside it.
- **Never encode a workaround for a bug as a convention** without saying it is a workaround.

## 5. Verify and report

1. Confirm each created file is at `<workspace>/.dsh/skills/<name>/SKILL.md` with
   `name` and `description` frontmatter present and `name` unique.
2. Validate discovery and check for issues:

```bash
ls "$DSH_HOME/skills"        # DSH discovers <name>/SKILL.md one level deep
```

Look for warnings with code `skill.missing_description`, and confirm the new names appear
with `"status": "winner"`. A `shadowed` status means a same-name skill in a higher scope won —
rename.
3. Report which skills were forged, what evidence each is based on (file paths), and which
   candidate areas were deliberately skipped because the project had nothing project-specific.

## Re-running

Re-run this skill when the app upgrades a major version, changes front end or admin stack,
or adopts a new convention that contradicts a forged skill. Update the affected skill rather
than adding a parallel one; stale skills silently mislead every later turn.
