---
name: workplans
version: 0.2.0
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
├── RULES.md       # This file (source of truth)
└── README.md      # Auto-generated plan index
```

## Workflow

| Action | Move to | Update frontmatter |
|--------|---------|-------------------|
| **Create** | `backlog/` | `state: "backlog"`, `backlog_date` = now |
| **Start work** | `backlog/` → `doing/` | `state: "doing"`, `doing_date` = now |
| **Complete** | `doing/` → `done/` | `state: "done"`, `done_date` = now |
| **Pause** | `backlog/` | `state: "backlog"`, clear `doing_date` |

New plans are created directly in `backlog/`. Every plan starts with a mandatory **Phase 1: Definition** that ensures the plan is fully defined before work begins. Early-stage exploration belongs in notes (see Extensions), not in structured plans.

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
issue: ""
backlog_date: "YYYY-MM-DDThh:mm"
doing_date: ""
done_date: ""
---

# User authentication setup

## Progress §
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps

### Phase 2: Define auth strategy
- [ ] Choose authentication method
- [ ] Document security requirements

## Objective §
Brief description of what this plan aims to achieve and why.

## Context §
Relevant background, constraints, or references that inform the plan.

## Implementation §
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective §, Context §, and the definition of subsequent phases._

### Phase 2: Define auth strategy
Technical details, decisions, and approach for this phase.

## Closing Summary §
_To be written when the last phase is completed._
```

### Plan Frontmatter

Every plan starts with YAML frontmatter on **line 1** (no blank lines before `---`). All fields present in every state; empty (`""`) if not applicable.

| Field | Description |
|-------|-------------|
| `id` | Timestamp ID matching the filename (`YYDDDsssss`). First field, immutable |
| `title` | Short descriptive title |
| `state` | Must match the folder the file lives in: `backlog`, `doing`, `done` |
| `author` | Human creator. Immutable once assigned. Comma-separated if multiple |
| `author_model` | AI model ID(s) that created the plan (e.g. `claude-opus-4-6`) |
| `assignee` | Person implementing |
| `assignee_model` | AI model ID(s) that executed the plan |
| `issue` | URL to linked issue (any tracker) |
| `backlog_date` | Datetime created (`YYYY-MM-DDThh:mm`) |
| `doing_date` | Datetime work started (`YYYY-MM-DDThh:mm`) |
| `done_date` | Datetime completed (`YYYY-MM-DDThh:mm`) |

### Plan Title

The first line after frontmatter is an H1 (`#`) that must match the `title` field exactly. One per file, no other H1 allowed.

### Plan Sections

Five H2 sections follow the title, in this order. Each heading uses Title Case + `§` suffix.

| Section | Purpose |
|---------|---------|
| `## Progress §` | Checklist mirror of Implementation phases. Always right after H1 |
| `## Objective §` | What this plan aims to achieve and why |
| `## Context §` | Background, constraints, or references that inform the plan |
| `## Implementation §` | Technical detail, decisions, and approach organized by phase |
| `## Closing Summary §` | Written when the last phase is completed. Bullet points: what was implemented, deviations, blockers, and anything left for future plans. Until then, contains: `_To be written when the last phase is completed._` |

### Mandatory Phase 1: Definition

Every plan must start with `### Phase 1: Definition` as its first phase. This phase has exactly two fixed steps:

```markdown
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps
```

These two fixed steps ensure every plan has a clear objective and defined phases before execution begins, regardless of which agent created it. A plan in backlog with Phase 1 unchecked is still being defined. When both steps are checked, the plan is fully defined and ready for execution (transition to `doing/`).

**Rules for Phase 1: Definition:**
- It is always the first phase in both Progress § and Implementation §
- The two steps are fixed and must not be modified
- The Implementation § entry for Phase 1 is always: `_No implementation needed — this phase tracks the completion of Objective §, Context §, and the definition of subsequent phases._`
- A plan must not move to `doing/` until both steps in Phase 1 are checked
- Subsequent phases (Phase 2, Phase 3, etc.) contain the actual work

## Rules

All 19 rules are mandatory. Ordered by criticality: **Structure** (framework integrity) → **Template** (plan validity) → **Data** (field correctness).

| # | Category | Rule |
|---|----------|------|
| 1 | Structure | `state` must match the folder the file lives in |
| 2 | Structure | `id` is the first frontmatter field, matches filename timestamp, immutable after creation |
| 3 | Structure | `workplans/` only contains structured plan files. No notes, docs, or unstructured content |
| 4 | Structure | Do not create files or folders that alter the `workplans/` structure |
| 5 | Structure | README files and RULES.md are system files. Do not remove or edit manually |
| 6 | Structure | Do not add custom frontmatter fields or markdown sections beyond the defined format |
| 7 | Template | H1 must match the `title` field |
| 8 | Template | H2 sections must use Title Case + `§` suffix. Only 5 valid sections allowed |
| 9 | Template | Progress § always right after H1; phases must mirror Implementation § |
| 10 | Template | Phase 1: Definition is mandatory in every plan with two fixed steps. Must not be modified |
| 11 | Template | Steps grouped by phase (`### Phase N: Name`), each concrete and verifiable. Use "Phase" and "Step" only (never "Stage") |
| 12 | Template | Technical detail in Implementation §, summary in Progress § |
| 13 | Template | Closing Summary § is the last section, written when the last phase is completed |
| 14 | Template | Every `.md` plan must follow the template and live in its state folder |
| 15 | Template | A plan must not move to `doing/` until Phase 1: Definition is complete |
| 16 | Data | Multi-value fields use comma-separated strings; datetimes use ISO 8601 `YYYY-MM-DDThh:mm`, `""` if not reached |
| 17 | Data | Datetimes must come from the system clock. Hardcoded, estimated, or placeholder values are forbidden |
| 18 | Data | `author` is immutable once assigned; multiple authors are comma-separated |
| 19 | Data | `_` separates timestamp ID from description; uniqueness = timestamp + description |

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

## README Index Files

The root `workplans/README.md` is the only auto-generated index. It is a **system file** — agents must regenerate it after creating, moving, or deleting plans. Never edit manually.

State folder READMEs (`backlog/README.md`, `doing/README.md`, `done/README.md`) are static descriptions with no dynamic content. They never need updating. Each links back to the root index with an anchor matching its state (e.g. `[View all plans](../README.md#doing)`).

### Root index (`workplans/README.md`)

Shows all plans in a single continuous table. Structure: H1 `# Plans`, a generic description, and a single table with all plans grouped by state. No counters — the table itself is the visual inventory. Each state label row includes an HTML anchor (`<a id="state"></a>`) so folder READMEs can deep-link to it. Links use the subfolder path (e.g. `doing/filename.md`). State order: Backlog, Doing, Done.

All three state groups (Backlog, Doing, Done) are always present in the table, even when empty. When a state has no plans, show a placeholder row with `_No plans_` in the Plan column:

```markdown
# Plans

This file tracks all your plans organized by state.

| ID | Plan | Author | Author Model |
|----|------|--------|--------------|
| | | | |
| <a id="backlog"></a>**Backlog** | | | |
| | _No plans_ | | |
| | | | |
| <a id="doing"></a>**Doing** | | | |
| | _No plans_ | | |
| | | | |
| <a id="done"></a>**Done** | | | |
| | _No plans_ | | |
```

When a state has plans, the placeholder row is replaced by plan rows:

```markdown
# Plans

This file tracks all your plans organized by state.

| ID | Plan | Author | Author Model |
|----|------|--------|--------------|
| | | | |
| <a id="backlog"></a>**Backlog** | | | |
| 2601551600 | [User authentication setup](backlog/2601551600_user-auth-setup.md) | sebastianserna | claude-opus-4 |
| | | | |
| <a id="doing"></a>**Doing** | | | |
| 2603440500 | [WebSocket real-time updates](doing/2603440500_websocket-realtime.md) | sebastianserna | deepseek-v3 |
| | | | |
| <a id="done"></a>**Done** | | | |
| 2600532400 | [Initial project setup](done/2600532400_project-setup.md) | sebastianserna | claude-opus-4 |
```

### Updating the index

When a plan is created, moved, or deleted, the agent must update only the root `workplans/README.md`:

1. Move the plan row from the source state group to the destination state group (or add/remove it)
2. If a state becomes empty after removing a plan, add the placeholder row `| | _No plans_ | | |`
3. If a state gains its first plan, remove the placeholder row and add the plan row

## Author detection

The `author` field identifies the **human** who requests or directs the creation of the plan, not the agent. The agent must **never** copy the author from existing plans. It must strictly follow the detection flow and confirm with the user before first use.

Resolve in order. Stop at the first valid result:

1. `git config user.name`
2. OS username. macOS / Linux / Git Bash / WSL: `echo $USER` · PowerShell: `$env:USERNAME`
3. Ask the user (last resort)

Generic usernames (`admin`, `root`, `guest`, `user`, `default`, `ubuntu`, `ec2-user`) are not valid. Skip to the next step.

**On creation (`backlog/`):** detection runs and must succeed before the plan is created. If all automatic detection fails, the user is prompted. No plan is created without a known author.

## AI model attribution

The `author_model` and `assignee_model` fields must never be empty if an AI agent participated. Use the exact model ID when known (e.g. `claude-opus-4-6`, `gpt-4o`). If the AI tool does not expose the specific model (e.g. Cursor auto mode, Copilot), register as `tool-name/auto` (e.g. `cursor/auto`). If the user knows the model, use the exact ID.

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

The `extend/` folder and its contents are not plan files. They are excluded from indexing and validation.

## Validation

After creating, moving, or deleting plans, run the validation script to verify integrity:

```bash
bash scripts/validate.sh <workplans-dir>
```

The script checks structure, file naming, frontmatter, template sections, and index synchronization. Fix any errors before continuing.

## Compatibility

The `version` field in RULES.md frontmatter declares the active format version. Agents and tools use this to detect which conventions apply.

- **Non-standard files** (no frontmatter, old naming format) are not silently ignored. They are flagged as unrecognized
