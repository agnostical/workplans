# Workplans v0.1.0

> **Source of truth for the Workplans framework.** AI agents must follow these rules when creating, moving, or modifying plans.

A plan is a structured Markdown file with states `draft` → `backlog` → `coding` → `done`. Each plan lives in the folder matching its current state.

```
workplans/
├── backlog/       # Pending plans
├── coding/        # Work in progress
├── done/          # Completed plans (archive)
├── draft/         # Drafts, ideas, and decisions
├── progress/      # Visual dashboard (open index.html in a browser)
└── README.md      # This file (source of truth)
```

## File naming

`TYPE-YYYY-MM-DD-author_description.md`

| Segment | Description |
|---------|-------------|
| `TYPE` | `BACKLOG`, `CODING`, `DONE`, `DRAFT` |
| `YYYY-MM-DD` | Transition date: creation (backlog/draft), work started (coding), completed (done) |
| `author` | Author identifier (see detection below) |
| `_description` | Underscore + short name in kebab-case |

### Author detection

Resolve in order — stop at the first valid result:

1. **VCS username:** `gh api user --jq .login` or parse remote URL — use exactly as returned
2. **OS fallback:** `$USER` / `%USERNAME%` — lowercase, no spaces
3. **Denylist:** reject generic OS/system names (`root`, `admin`, `user`, and similar) — if rejected, go to step 4
4. **Failsafe:** ask the user for their username

Once resolved, confirm with the user before first use. If plans by this author already exist, skip confirmation on subsequent runs.

## Frontmatter

Every plan starts with YAML frontmatter on **line 1** (no blank lines before `---`). All fields present in every state — empty (`""`) if not applicable.

| Field | Description |
|-------|-------------|
| `plan` | Short descriptive title |
| `state` | Must match filename prefix: `backlog`, `coding`, `done`, `draft` |
| `author` | Creator first, comma-separated if multiple |
| `author_model` | AI model ID(s) that created the plan (e.g. `claude-opus-4-6`) |
| `assignee` | Person implementing |
| `assignee_model` | AI model ID(s) that executed the plan |
| `issue` | URL to linked issue (any tracker) |
| `backlog` | Date created |
| `coding` | Date work started |
| `done` | Date completed |
| `tags` | Comma-separated labels |

## Template

Optional sections (`Risks`, `Comments`) are **omitted**, not left empty. Use "Phase" and "Step" only (never "Stage").

```markdown
---
plan: "Descriptive title"
state: "backlog"
author: ""
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
backlog: "YYYY-MM-DD"
coding: ""
done: ""
tags: ""
---

# Descriptive title

## Progress
### Phase 1: Name
- [ ] Concrete, verifiable step

## Objective

## Context

## Implementation
### Phase 1: Name

## Verification

## Risks

## Comments
### YYYY-MM-DD — author
```

## Workflow

| Action | Move to | Rename prefix | Update frontmatter |
|--------|---------|---------------|-------------------|
| **Create** | `backlog/` | `BACKLOG` | `state`, `author`, `backlog` date |
| **Start work** | `coding/` | `CODING` | `state: "coding"`, `coding` date = today |
| **Complete** | `done/` | `DONE` | `state: "done"`, `done` date = today |
| **Pause** | `backlog/` | `BACKLOG` | `state: "backlog"`, clear `coding` |
| **Draft** | `draft/` | `DRAFT` | Same rules; promote to `backlog/` when mature — update `state` + `backlog` date |

The date in the filename always updates to reflect the transition.

## Rules

1. `state` must match filename prefix; first `author` must match filename author
2. H1 must match the `plan` field
3. Progress section always right after H1; phases must mirror Implementation phases
4. Steps grouped by phase (`### Phase N: Name`), each concrete and verifiable
5. Technical detail in Implementation, summary in Progress
6. Comments always last, chronological (oldest first)
7. Multi-value fields use comma-separated strings; date fields use `""` if not reached
8. Author is permanent across states; filename uses creator only (co-authors in frontmatter)
9. `_` separates author from description; uniqueness = date + author + description
10. Reference plans by description (`user-auth-setup`), never full filename; use `#N` for linked issues
11. `workplans/` only contains structured plan files — no notes, docs, or unstructured content
12. Every `.md` must follow the template and live in its state folder
13. Do not create files or folders that alter the `workplans/` structure
14. README files are system files — do not remove
