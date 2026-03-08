---
name: workplans
version: 0.2.0
---

# Workplans: Rules

> **Source of truth for the Workplans framework.** AI agents must follow these rules when creating, moving, or modifying plans. Do not edit manually. This file is managed by framework releases.

A plan is a structured Markdown file with states `draft` → `backlog` → `doing` → `done`. Each plan lives in the folder matching its current state.

```
workplans/
├── backlog/       # Pending plans
├── doing/         # Work in progress
├── done/          # Completed plans
├── draft/         # Early-stage plans
├── extend/        # Optional extensions (created on demand)
├── RULES.md       # This file (source of truth)
└── README.md      # Auto-generated plan index
```

## Workflow

| Action | Move to | Update frontmatter |
|--------|---------|-------------------|
| **Draft** | `draft/` | `state: "draft"`, `draft_date` = now |
| **Promote** | `draft/` → `backlog/` | `state: "backlog"`, `author`, `backlog_date` = now |
| **Start work** | `backlog/` → `doing/` | `state: "doing"`, `doing_date` = now |
| **Complete** | `doing/` → `done/` | `state: "done"`, `done_date` = now |
| **Pause** | `backlog/` | `state: "backlog"`, clear `doing_date` |

The filename never changes on state transitions. Only the folder and frontmatter are updated.

## Plan Format

This format is intentionally strict. Every element has a fixed format and a single purpose. Do not add custom fields and sections. Why? Plans are created and edited by multiple agents over time. Free-form elements lead to inconsistent data because each agent decides differently what to write.

Every plan must follow this structure. The example below shows the required sections and field order. Replace the sample content with actual plan data.

```markdown
---
id: 2606455842
title: "User authentication setup"
state: "draft"
author: ""
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
draft_date: "YYYY-MM-DDThh:mm"
backlog_date: ""
doing_date: ""
done_date: ""
---

# User authentication setup

## Progress §
### Phase 1: Define auth strategy
- [ ] Choose authentication method
- [ ] Document security requirements

## Objective §
Brief description of what this plan aims to achieve and why.

## Context §
Relevant background, constraints, or references that inform the plan.

## Implementation §
### Phase 1: Define auth strategy
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
| `state` | Must match the folder the file lives in: `backlog`, `doing`, `done`, `draft` |
| `author` | Human creator. Immutable once assigned. Comma-separated if multiple |
| `author_model` | AI model ID(s) that created the plan (e.g. `claude-opus-4-6`) |
| `assignee` | Person implementing |
| `assignee_model` | AI model ID(s) that executed the plan |
| `issue` | URL to linked issue (any tracker) |
| `draft_date` | Datetime drafted (`YYYY-MM-DDThh:mm`) |
| `backlog_date` | Datetime added to backlog (`YYYY-MM-DDThh:mm`) |
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

## Rules

All 18 rules are mandatory. Ordered by criticality: **Structure** (framework integrity) → **Template** (plan validity) → **Data** (field correctness).

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
| 10 | Template | Steps grouped by phase (`### Phase N: Name`), each concrete and verifiable. Use "Phase" and "Step" only (never "Stage") |
| 11 | Template | Technical detail in Implementation §, summary in Progress § |
| 12 | Template | Closing Summary § is the last section, written when the last phase is completed |
| 13 | Template | Every `.md` plan must follow the template and live in its state folder |
| 14 | Data | Multi-value fields use comma-separated strings; datetimes use ISO 8601 `YYYY-MM-DDThh:mm`, `""` if not reached |
| 15 | Data | Datetimes must come from the system clock. Hardcoded, estimated, or placeholder values are forbidden |
| 16 | Data | `author` is immutable once assigned; multiple authors are comma-separated |
| 17 | Data | `_` separates timestamp ID from description; uniqueness = timestamp + description |
| 18 | Data | Reference plans by description (`user-auth-setup`) or by ID; use `#N` for linked issues |

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

Every folder contains an auto-generated `README.md` that serves as an index. These files are **system files** — agents must regenerate them after creating, moving, or deleting plans. Never edit manually.

### Root index (`workplans/README.md`)

Shows a summary table with plan counts per state, followed by a horizontal rule and one H2 section per state with the full plan table. Links use the subfolder path (e.g. `doing/filename.md`). Section order: Backlog, Doing, Done, Draft.

```markdown
# Workplans

Structured plans organized by workflow state.

---

| Backlog | Doing | Done | Draft |
|:-------:|:-----:|:----:|:-----:|
| 0 | 0 | 0 | 0 |

_No plans yet. See [RULES.md](RULES.md) to get started._
```

The empty-state message and horizontal rule are removed once plans exist. When plans exist, each state with plans gets an H2 section:

```markdown
## Doing (3)

| ID | Plan | Author | Author Model |
|----|------|--------|--------------|
| 2603440500 | [WebSocket real-time updates](doing/2603440500_websocket-realtime.md) | sebastianserna | deepseek-v3 |
```

Empty states are omitted from the root index (no empty tables).

### State folder index (`draft/README.md`, `backlog/README.md`, etc.)

Each state folder README has: H1 with count, a brief description, a horizontal rule, and a table with four columns: `ID`, `Plan`, `Author`, and `Author Model`. The `Plan` column links to the plan file. Plans are sorted by ID descending (most recent first).

| State | Description |
|-------|-------------|
| Draft | Plans in early stages, pending review and approval. |
| Backlog | Approved plans queued and ready to start. |
| Doing | Plans in progress, currently being implemented. |
| Done | Plans that have been completed. |

```markdown
# Draft Plans (3 total)

Plans in early stages, pending review and approval.

---

| ID | Plan | Author | Author Model |
|----|------|--------|--------------|
| 2605639600 | [File upload system](2605639600_file-upload-system.md) | sebastianserna | claude-opus-4-6 |
| 2604655800 | [Dark mode design system](2604655800_dark-mode-design.md) | sebastianserna | claude-opus-4-6 |
| 2604141400 | [API rate limiting strategy](2604141400_api-rate-limiting.md) | sebastianserna | claude-opus-4-6 |
```

When the folder is empty, show an empty table and a message:

```markdown
# Backlog Plans (0 total)

Approved plans queued and ready to start.

---

| ID | Plan | Author | Author Model |
|----|------|--------|--------------|

_No plans in backlog._
```

Empty-state messages per folder: Draft → `_No drafts._`, Backlog → `_No plans in backlog._`, Doing → `_No plans in progress._`, Done → `_No completed plans._`

### Updating indexes on state transitions

When a plan changes state, the agent must update three README files:

1. **Source folder README** — remove the plan row, decrement the count
2. **Destination folder README** — add the plan row with the correct link to the file in the new folder, increment the count. Insert in descending ID order
3. **Root README** — update the counts for both affected states

If a folder becomes empty after removing a plan, restore the empty-state message. If a folder was empty before adding a plan, remove the empty-state message.

## Author detection

The `author` field identifies the **human** who requests or directs the creation of the plan, not the agent. The agent must **never** copy the author from existing plans. It must strictly follow the detection flow and confirm with the user before first use.

Resolve in order. Stop at the first valid result:

1. `git config user.name`
2. OS username. macOS / Linux / Git Bash / WSL: `echo $USER` · PowerShell: `$env:USERNAME`
3. Ask the user (last resort)

Generic usernames (`admin`, `root`, `guest`, `user`, `default`, `ubuntu`, `ec2-user`) are not valid. Skip to the next step.

**On creation (`draft/`):** detection runs but does not block. If it succeeds, `author` is written to frontmatter. If it fails, the field remains empty.

**On transition out of `draft/`:** if `author` is still empty, detection runs again. Only if all automatic detection fails, the user is prompted. No plan advances beyond `draft/` without a known author.

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
