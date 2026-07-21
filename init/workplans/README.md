# Plans

A structured, agent-friendly format for managing project plans through `backlog → doing → done` states.

## Quick start

Plans are Markdown files that move through three folders:

| State | Folder | Description |
|-------|--------|-------------|
| Backlog | [backlog/](backlog/) | Pending plans, waiting for definition or execution |
| Doing | [doing/](doing/) | Plans in progress, currently being implemented |
| Done | [done/](done/) | Completed and closed plans |

To create a plan, ask your AI agent:

> _Create a plan for implementing user authentication with OAuth2_

The agent follows the canonical rules in [RULES.md](RULES.md) to generate the plan file and place it in `backlog/`. As work progresses, the agent moves the file between folders and updates its metadata.

## Why a strict format?

Plans are created and edited by multiple agents — and humans — over time. Free-form plans drift: each agent decides differently what to write where, and the data becomes unreliable. A strict format means:

- Any agent can find and update any plan correctly
- Plans validate automatically
- Plan state is machine-readable, not just human-readable
- Conventions stay consistent across projects

The structure is the contract. The full spec lives in [RULES.md](RULES.md); this README explains the model and the workflow around it.

## The kanban model

Every plan moves through three states:

1. **Backlog** — defined but not started. Phase 1 (Definition) is being filled in.
2. **Doing** — actively being implemented. Phase 1 is complete; the agent and user are working through subsequent phases.
3. **Done** — Closing phase complete, user has validated. The plan is now an immutable historical artifact.

A plan must complete its **Phase 1: Definition** (entry gate) before moving to `doing/`. It must complete its **Closing phase** (exit gate) and obtain explicit user approval before moving to `done/`. These two phases are mandatory in every plan and have fixed steps.

## Plan creation

When you ask an agent to create a plan, it should:

1. Detect the planner (`git config user.name`, OS username, or ask you), resolving the identity against the `people` roster when `settings.yml` declares one.
2. Decide which branch to commit the plan on (only when the workplans folder is inside a Git repo or another VCS — skipped otherwise):
   - Follow any policy declared in your project's agent file (CLAUDE.md, AGENTS.md, etc.).
   - Use the current branch if you are not on `main`.
   - Otherwise, ask whether to create a new branch first.
3. Generate the timestamp ID from the system clock.
4. Write the plan file in `backlog/` using the canonical template.
5. Walk you through Phase 1: objective, phases, refinement.

## File naming

Files are named `{YYDDDsssss}_{description}.md`:

- `YYDDDsssss` — system-clock timestamp at creation, immutable. Acts as the plan's stable identity.
- `description` — kebab-case, matches `title`. May be renamed when `title` evolves substantially (use `git mv` to preserve history).

Example: `2606455842_user-auth-setup.md` corresponds to 2026, day 064, 15:30:42.

State transitions (`backlog/` → `doing/` → `done/`) never rename. They only move the file between folders and update frontmatter.

## Versioning and compatibility

The `version` field in [RULES.md](RULES.md) declares the active framework version. Each plan declares its own `format` at creation (named `format_version` before 0.4.0 — parsers accept both), and validators apply the rule set matching that value. This means:

- Plans created under different framework versions can coexist in the same repository.
- Migrating a plan to a new format is opt-in per plan; legacy plans keep working. Agents offer migration for `backlog/` plans, migrate `doing/` plans only on request, and never touch `done/`. The same operation is reproducible via `npx workplans migrate`.
- Historical plans in `done/` retain their original layout — they are artifacts, not living documents.

Plans without a format field are treated as pre-0.2.1 legacy.

## Closing Summary: voice and example

The Closing Summary's leader paragraph is exported verbatim to changelogs and tracker closing comments, so it is written for a reader with zero context. The craft is in what it avoids:

- **Open with the result, never the process.** "The sync command now mirrors plans into Linear" — not "During this plan we worked on sync".
- **No actor.** Impersonal constructions or the deliverable as subject; people and models already live in the frontmatter.
- **Nothing that doesn't travel.** Phase numbers, plan ids, and internal paths mean nothing on a release page. Time references ("today", "this week") go stale. Links belong in `References`.

The labels (`Delivered`, `Decisions`, `Verification`, `Deferred`, `References`) are always English; the prose follows the user's language — the voice criteria are language-independent. Canonical example:

```markdown
## Closing Summary
The sync command now mirrors plans into Linear with idempotent re-runs: every
mirror issue carries a plan marker, so interrupted or repeated syncs never
duplicate issues. Closed plans post their summary as a closing comment
automatically. Setup requires a single tracker URL in the project settings.

### Delivered
- Sync command with create and update modes
- Linear adapter with marker-based idempotency

### Decisions
- Backdating applies only at creation; updates never rewrite tracker history

### Deferred
- GitHub adapter, registered in plan 2619460001

### References
- PR: https://github.com/acme/backend/pull/142
- Docs: https://acme.dev/docs/sync
```

## Project settings

`workplans/settings.yml` is the home of project-level configuration, with `workplans/settings.local.yml` as its machine-local override (gitignored, never committed). Both are optional — a new project needs neither; the file appears the first time there is something to declare. Once present it is binding: agents read it before writing plans and honor its declarations. All keys are optional with defaults:

```yaml
tracker: "https://github.com/acme/project-a"
estimate_scale: "fibonacci"

projects:
  main:
    work_on: "https://github.com/acme/project-a"

people:
  Alice: "alice@acme.example"
```

Absent `work_on` means plans target this same repo; absent `tracker` means no sync; absent `estimate_scale` means Fibonacci; absent `people` means identity detection uses git/OS values as-is. The `projects:` block is always written when the file exists — its key is the project's name, `main` when none is declared. This README is informative and user-owned after init; it carries no configuration.

## Work destination

The `work_on` setting tells agents where plan execution applies. Two scenarios:

**Same repo (`work_on: "."`)** — plans and code live in the same project. The agent reads plans from `workplans/` and applies code changes in the parent directory.

**External repo (`work_on: "https://github.com/org/project"`)** — plans live here, code lives elsewhere. The agent applies code changes in a local clone of the target.

### settings.local.yml

When `work_on` is a remote URL, the agent must resolve where the target repo lives on this machine. The resolved path is stored in `workplans/settings.local.yml`:

```yaml
# Machine-local overrides. Do not commit.
projects:
  main:
    work_on: "/Users/me/repos/org/project"
```

`settings.local.yml` is always gitignored — local paths differ across machines and must not be committed.

**Resolution flow** when `work_on` is a remote URL:

1. Read `settings.local.yml` — use it if the path is valid.
2. Check if the parent directory's `git remote -v` matches the URL — use here if it does.
3. Search the machine for a cloned directory with that remote.
4. Found: write it to `settings.local.yml`, confirm with the user.
5. Not found: ask the user for the local path, write it to `settings.local.yml`.

### Two-way configuration

When `work_on` is a remote URL, both repos need to be configured:

- **Planning repo** — the `work_on` constant in this README's frontmatter points to the target project.
- **Target repo** — its agent file (AGENTS.md / CLAUDE.md) declares where plans are managed.

Without the target-side instruction, an agent working in the target repo will not know plans exist elsewhere and may try to create them locally.

The target repo's agent file is also the source of truth for execution conventions — branching, commit and PR format, language. The planning repo's conventions govern only the plan files.

## Extensions

Optional functionality lives in `workplans/extend/`, one subfolder per extension. The folder is not created by default — it appears only when you install your first extension.

```
workplans/
├── extend/
│   ├── board/    # → from agnostical/board
│   └── notes/    # → from agnostical/notes
```

Install via giget:

```bash
npx giget gh:agnostical/board workplans/extend/board
```

Contents under `extend/` are not plan files and are excluded from validation.

## Reference

- **[RULES.md](RULES.md)** — canonical rules and format spec. The source of truth.
- **[backlog/README.md](backlog/README.md)** — example plan in `backlog` state.
- **[doing/README.md](doing/README.md)** — example plan in `doing` state.
- **[done/README.md](done/README.md)** — example plan in `done` state.
- **GitHub** — [agnostical/workplans](https://github.com/agnostical/workplans) — issues, releases, extensions.
