# AGENTS.md

Agent-agnostic instructions for this repository. Tool-specific files (CLAUDE.md, .cursor/rules, etc.) point here.

## About this repo

This is the **public framework repository** for [Workplans](https://github.com/agnostical/workplans). It contains the framework definition (RULES.md, templates, scripts, examples) and is the target for code execution.

## Internal development plans

Internal development plans for this project are managed in a separate private repository: https://github.com/agnostical/workplans-dev

**Do not create development plans in this repo.** If asked to create, edit, or manage internal plans, direct the user to work from `workplans-dev`.

The `workplans/` folder in this repo contains **demo/example plans** that are part of the framework — not internal development plans.

### Finding plans

When asked to find, read, or execute a plan (by ID, title, or description), search in the **local clone** of `workplans-dev`. Do not search in `.dev/`, session logs, or cached data — always go to the actual repo on disk.

**Resolution flow:**
1. Check if `workplans-dev` is cloned locally as a sibling directory (e.g. `../workplans-dev`).
2. If not found as sibling, search common locations on the machine.
3. If not found, ask the user for the local path.
4. Once located, search inside `workplans/backlog/`, `workplans/doing/`, and `workplans/done/` for the plan.

### Executing plans from this repo

When executing a plan that lives in `workplans-dev`, you are working across two repositories:

| Action | Where |
|--------|-------|
| **Read and follow plan instructions** | `workplans-dev` (where the plan file lives) |
| **Apply code changes** (code, configs, scripts, templates) | This repo (`workplans`) — as indicated by `work_on` in RULES.md |
| **Update the plan file** (mark steps, move between folders, update frontmatter) | `workplans-dev` (where the plan file lives) |

**You must follow the full RULES.md lifecycle on the plan file in `workplans-dev`:**
- Before starting work: move the plan to `doing/`, update `state` and `doing_date` in frontmatter
- As you complete each step: mark it with `[x]` in both Progress and the corresponding Implementation section
- When all phases are done: move the plan to `done/`, update `state` and `done_date`, write the Closing Summary
- All datetime values must come from the system clock (`date +"%Y-%m-%dT%H:%M"`)

The plan file is not read-only context — it is a living document that must reflect the current state of execution at all times.

## Git workflow

- Main branch: `main` (protected, PRs required)
- Branches: `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`, `docs/` + description in English
- Commits: Conventional Commits in English (`feat:`, `fix:`, `docs:`, etc.)
- PRs: title in English (Conventional Commits), body/description in English
- Issues: title and description in English
- **Do not include** `Co-Authored-By` from AI agents in commits
- **Do not include** "Generated with Claude Code" links in commit messages or PRs
