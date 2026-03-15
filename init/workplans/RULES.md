---
name: workplans
version: 0.2.1
work_on: "."
---

# Workplans: Rules

> **Source of truth for the Workplans framework.** AI agents must follow these rules when creating, moving, or modifying plans. Do not edit manually. This file is managed by framework releases.

A plan is a structured Markdown file with states `backlog` → `doing` → `done`. Each plan lives in the folder matching its current state.

```
workplans/
├── backlog/       # Pending plans
├── doing/         # Work in progress
├── done/          # Completed plans
├── extend/        # Optional extensions (created on demand)
├── README.md      # General info
└── RULES.md       # This file (source of truth)
```

## Workflow

| Action | Move to | Update frontmatter |
|--------|---------|-------------------|
| **Create** | `backlog/` | `state: "backlog"`, `backlog_date` = now |
| **Start work** | `backlog/` → `doing/` | `state: "doing"`, `doing_date` = now |
| **Complete** | `doing/` → `done/` | `state: "done"`, `done_date` = now |
| **Pause** | `backlog/` | `state: "backlog"`, clear `doing_date` |

New plans are created directly in `backlog/`. Every plan starts with a mandatory **Phase 1: Definition** (entry gate) and ends with a mandatory **Closing phase** (exit gate). Early-stage exploration belongs in notes (see Extensions), not in structured plans.

The filename never changes on state transitions. Only the folder and frontmatter are updated.

## Plan Format

This format is intentionally strict. Every element has a fixed format and a single purpose. Do not add custom fields and sections. Why? Plans are created and edited by multiple agents over time. Free-form elements lead to inconsistent data because each agent decides differently what to write.

Every plan must follow this structure. The example below shows the required sections and field order. Replace the sample content with actual plan data.

```markdown
---
id: 2606455842
title: "User authentication setup"
state: "backlog"
author: ""
author_model: ""
assignee: ""
assignee_model: ""
backlog_date: "YYYY-MM-DDThh:mm"
doing_date: ""
done_date: ""
format_version: "0.2.1"
---

# User authentication setup

## Progress
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps
- [ ] Refine with the user

### Phase 2: Define auth strategy
- [ ] Choose authentication method
- [ ] Document security requirements

### Phase 3: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Objective
Brief description of what this plan aims to achieve and why.

## Context
Relevant background, constraints, or references that inform the plan.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Define auth strategy
Technical details, decisions, and approach for this phase.

### Phase 3: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
```

> **Note:** The template above is in English as reference. Agents must adapt user-authored content (titles, step descriptions, Implementation text) to the user's language. Only the `Phase N:` prefix and structural headings remain in English.

### Plan Frontmatter

Every plan starts with YAML frontmatter on **line 1** (no blank lines before `---`). All fields present in every state; empty (`""`) if not applicable.

| Field | Description |
|-------|-------------|
| `id` | Timestamp ID matching the filename (`YYDDDsssss`). First field, immutable |
| `title` | Short descriptive title |
| `state` | Must match the folder the file lives in: `backlog`, `doing`, `done` |
| `author` | Human creator. Immutable once assigned. Comma-separated if multiple |
| `author_model` | AI model ID(s) that created the plan. See AI model attribution |
| `assignee` | Person implementing |
| `assignee_model` | AI model ID(s) that executed the plan |
| `backlog_date` | Datetime created (`YYYY-MM-DDThh:mm`) |
| `doing_date` | Datetime work started (`YYYY-MM-DDThh:mm`) |
| `done_date` | Datetime completed (`YYYY-MM-DDThh:mm`) |
| `format_version` | Framework version at creation time (from RULES.md `version`). Immutable |

### Plan Title

The first line after frontmatter is an H1 (`#`) that must match the `title` field exactly. One per file, no other H1 allowed.

### Plan Sections

Five H2 sections follow the title, in this order. Each heading uses Title Case.

| Section | Purpose |
|---------|---------|
| `## Progress` | Checklist mirror of Implementation phases. Always right after H1 |
| `## Objective` | What this plan aims to achieve and why |
| `## Context` | Background, constraints, or references that inform the plan |
| `## Implementation` | Technical detail, decisions, and approach organized by phase. The level of detail scales with plan complexity — the examples in state folder READMEs are a starting point, not a ceiling |
| `## Closing Summary` | Written when the last phase is completed. Bullet points: what was implemented, deviations, blockers, and anything left for future plans. Until then, contains: `_To be written when the last phase is completed._` |

### Mandatory Phase 1: Definition

Every plan must start with `### Phase 1: Definition` as its first phase. This phase has exactly three fixed steps:

```markdown
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps
- [ ] Refine with the user
```

These three fixed steps ensure every plan has a clear objective, defined phases, and explicit user validation before execution begins, regardless of which agent created it. A plan in backlog with Phase 1 unchecked is still being defined. When all three steps are checked, the plan is fully defined and ready for execution (transition to `doing/`).

Completing Phase 1 does not authorize automatic state transitions. The agent must always ask the user before moving a plan to `doing/` or `done/`.

**Rules for Phase 1: Definition:**
- It is always the first phase in both Progress and Implementation
- The three steps are fixed and must not be modified
- The `Phase N:` prefix is always in English. The title after the colon and the step descriptions follow the user's language
- The Implementation entry for Phase 1 uses plain text (not italic): `Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.` — adapted to the user's language. Italic is reserved exclusively for temporary placeholders that will be replaced
- A plan must not move to `doing/` until all three steps in Phase 1 are checked
- Subsequent phases (Phase 2, Phase 3, etc.) contain the actual work

### Mandatory final phase: Closing

Every plan must end with a Closing phase as its last phase. This is the exit gate — symmetric to Phase 1 (Definition). The phase has exactly two fixed steps:

```markdown
### Phase N: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user
```

The plan structure is always:

```
Phase 1: Definition       ← entry gate (mandatory)
Phase 2..N-1: [phases]    ← implementation
Phase N: Closing           ← exit gate (mandatory)
```

**Rules for the Closing phase:**
- It is always the last phase in both Progress and Implementation
- The two steps are fixed and must not be modified
- The `Phase N:` prefix is always in English. The title after the colon and the step descriptions follow the user's language
- The Implementation entry for the Closing phase uses plain text (not italic): `Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.` — adapted to the user's language
- A plan must not move to `done/` until both steps in the Closing phase are checked
- The agent must request explicit approval from the user before moving the plan to `done/`

## Rules

All 24 rules are mandatory. Ordered by criticality: **Structure** (framework integrity) → **Template** (plan validity) → **Data** (field correctness).

| # | Category | Rule |
|---|----------|------|
| 1 | Structure | `state` must match the folder the file lives in |
| 2 | Structure | `id` is the first frontmatter field, matches filename timestamp, immutable after creation |
| 3 | Structure | `workplans/` only contains structured plan files. No notes, docs, or unstructured content |
| 4 | Structure | Do not create files or folders that alter the `workplans/` structure |
| 5 | Structure | README files and RULES.md are system files. Do not remove or edit manually |
| 6 | Structure | Do not add custom frontmatter fields or markdown sections beyond the defined format |
| 7 | Template | H1 must match the `title` field |
| 8 | Template | H2 sections must use Title Case. Only 5 valid sections allowed |
| 9 | Template | Progress always right after H1; phases must mirror Implementation |
| 10 | Template | Phase 1: Definition is mandatory in every plan with three fixed steps. Must not be modified |
| 11 | Template | Closing phase is mandatory as the last phase in every plan with two fixed steps. Must not be modified |
| 12 | Template | Steps grouped by phase (`### Phase N: Name`), each concrete and verifiable. Use "Phase" and "Step" only (never "Stage") |
| 13 | Template | Technical detail in Implementation, summary in Progress |
| 14 | Template | Closing Summary is the last section, written when the last phase is completed |
| 15 | Template | Every `.md` plan must follow the template and live in its state folder |
| 16 | Template | A plan must not move to `doing/` until Phase 1: Definition is complete |
| 17 | Template | A plan must not move to `done/` until the Closing phase is complete and the user has approved |
| 18 | Template | Issue references go inline as Markdown links in the relevant step or section, not in frontmatter. Use `[#N](url)` format |
| 19 | Data | Multi-value fields use comma-separated strings; datetimes use ISO 8601 `YYYY-MM-DDThh:mm`, `""` if not reached |
| 20 | Data | Datetimes must come from the system clock. Hardcoded, estimated, or placeholder values are forbidden |
| 21 | Data | `author` is immutable once assigned; multiple authors are comma-separated |
| 22 | Data | `_` separates timestamp ID from description; uniqueness = timestamp + description |
| 23 | Data | `format_version` is immutable and must match the `version` field in RULES.md at creation time |
| 24 | Template | Plan files must not contain emojis. Use plain descriptive text instead |

---

## File naming

### Format

`{YYDDDsssss}_{description-in-kebab-case}.md`

| Segment | Description |
|---------|-------------|
| `YY` | Last 2 digits of the year |
| `DDD` | Ordinal day of the year, ISO 8601 (001–366) |
| `sssss` | Seconds elapsed in the day (00000–86399) |
| `_` | Separator between ID and description |
| `description` | Short name in kebab-case |

Example: `2606455842_user-auth-setup.md` (2026, day 064, 15:30:42)

The timestamp ID is generated **once at creation** and **never changes**. State transitions only move the file to a different folder. The filename stays the same.

### Timestamp generation (filename ID)

The timestamp **must** be generated from the system clock. Never hardcoded, estimated, or calculated manually. The agent must execute a shell command to obtain the value:

- macOS / Linux / Git Bash / WSL: `printf "%s%05d" "$(date +%y%j)" "$(echo "$(date +%H)*3600+$(date +%M)*60+$(date +%S)" | bc)"`
- PowerShell: `$d = Get-Date; "{0:yy}{0:D3}{1:D5}" -f $d, [int]($d - $d.Date).TotalSeconds`

### Datetime fields (state transitions)

Before writing any datetime field, the agent **must** query the system clock. Hardcoded, estimated, or placeholder values (e.g. `T00:00`) are strictly forbidden:

- macOS / Linux / Git Bash / WSL: `date +"%Y-%m-%dT%H:%M"`
- PowerShell: `Get-Date -Format "yyyy-MM-ddTHH:mm"`

If the command fails, the agent must report it to the user before continuing.

## Author detection

The `author` field identifies the **human** who requests or directs the creation of the plan, not the agent. The agent must **never** copy the author from existing plans. It must strictly follow the detection flow and confirm with the user before first use.

Resolve in order. Stop at the first valid result:

1. `git config user.name`
2. OS username. macOS / Linux / Git Bash / WSL: `echo $USER` · PowerShell: `$env:USERNAME`
3. Ask the user (last resort)

Generic usernames (`admin`, `root`, `guest`, `user`, `default`, `ubuntu`, `ec2-user`) are not valid. Skip to the next step.

**On creation (`backlog/`):** detection runs and must succeed before the plan is created. If all automatic detection fails, the user is prompted. No plan is created without a known author.

## AI model attribution

The `author_model` and `assignee_model` fields must never be empty if an AI agent participated. The model ID is the root attribution. An optional client suffix records the tool used to run the model.

| Case | Format | Example |
|------|--------|---------|
| Model known, direct client | `{model}` | `claude-opus-4-6` |
| Model known, via client | `{model}/{client}` | `claude-opus-4-6/cursor` |
| Model unknown | `{client}/auto` | `cursor/auto` |

The client suffix is omitted when the agent runs directly (API, Claude Code, web chat). If the user knows the exact model, always use the model ID.

## Language

- **Template structure** (section headings, `Phase` keyword) and **filenames** are always in English
- **Frontmatter field names** are always in English (they are part of the schema)
- **User-authored content** (plan title, descriptions, steps, closing summary) follows the user's language

## Extensions

Optional extensions live in `workplans/extend/`, one subfolder per extension. This folder is **not created by default**. It appears only when the user installs their first extension.

```
workplans/
├── extend/
│   ├── board/    # → from agnostical/board
│   └── notes/    # → from agnostical/notes
```

Install extensions via giget:

```bash
npx giget gh:agnostical/board workplans/extend/board
```

The `extend/` folder and its contents are not plan files. They are excluded from validation.

## Validation

After creating, moving, or deleting plans, run the validation script to verify integrity:

```bash
bash scripts/validate.sh <workplans-dir>
```

The script checks structure, file naming, frontmatter, and template sections. Fix any errors before continuing.

## Work destination (Experimental)

The `work_on` field in RULES.md frontmatter indicates where plans in this folder apply their execution changes. It defaults to the parent directory of `workplans/`.

| Value | Meaning |
|-------|---------|
| `"."` (default) | Parent directory of `workplans/`. Plans target the same project |
| Remote URL | Plans target a different location (e.g. `https://github.com/org/project`) |

There are two types of changes, and each has a different destination:

| Type of change | Where it happens |
|----------------|-----------------|
| **Plan files** (Markdown, frontmatter, move between folders) | Always inside the `workplans/` folder where the plans live |
| **Plan execution** (code, configs, assets) | At the location indicated by `work_on` (resolved from the parent directory of `workplans/`) |

**Valid values in RULES.md:** Only `"."` or a remote URL. Never local paths — local paths differ across machines and cause conflicts in collaborative repositories.

### LOCAL.yml

When `work_on` is a remote URL, the agent needs to resolve where that project is on the local machine. The resolved path is stored in `LOCAL.yml` inside `workplans/`.

```yaml
# Auto-generated by agent. Do not commit.
work_on: "/Users/me/repos/org/project"
```

Rules for LOCAL.yml:
- Always in `.gitignore` — never committed
- Auto-generated by the agent — the user does not create it manually
- Only created when `work_on` is a remote URL (not created if `work_on` is `"."`)
- Contains only the resolved local path for `work_on`

**Resolution flow** (when `work_on` is a remote URL):
1. Check `LOCAL.yml` in `workplans/` → if it exists and the path is valid, use it
2. Check if the parent directory already matches that URL (check `git remote -v`) → if it matches, work here
3. Search the machine for a cloned directory with that remote
4. If found → create `LOCAL.yml` with the path, confirm with the user
5. If not found → ask the user for the local path, create `LOCAL.yml`

### Two-way configuration

When `work_on` points to a remote URL, both the planning repo and the target project need explicit instructions for agents:

**Planning repo** (where plans live): Set `work_on` in RULES.md to the target project URL. This tells agents where to apply code changes when executing plans.

**Target project** (where code lives): Add an instruction in its agent file (AGENTS.md, CLAUDE.md, etc.) indicating where plans are managed. This tells agents where to find, create, and update plans when working from the target project. Without this, an agent working in the target project will not know that plans exist elsewhere and may try to create them locally.

Both sides must be configured. The planning repo knows where to execute; the target project knows where plans live.

## Compatibility

The `version` field in RULES.md frontmatter declares the active format version. Agents and tools use this to detect which conventions apply.

- **Non-standard files** (no frontmatter, old naming format) are not silently ignored. They are flagged as unrecognized
- Plans without `format_version` are implicitly pre-0.2.1

## README Files

All README files (`workplans/README.md`, `backlog/README.md`, `doing/README.md`, `done/README.md`) are static descriptions. They contain no dynamic content and never need updating by agents. They are system files — do not edit manually.
