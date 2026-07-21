# workplans

CLI for the [Workplans framework](https://github.com/agnostical/workplans) — install and update markdown plan structures for AI agents.

## Install

```bash
npx workplans init
```

This scaffolds a `workplans/` folder in the current directory with `RULES.md`, `README.md`, and the `backlog/`, `doing/`, `done/` state folders.

## Commands

```bash
npx workplans init             # Scaffold the framework (fails if workplans/ already exists)
npx workplans update           # Refresh system files (RULES.md, state-folder READMEs)
                               # User plans and the root README are never touched
npx workplans migrate          # Migrate backlog plans to the installed format version
npx workplans validate         # Validate the corpus: contract errors (exit 1), style lints (exit 0)
npx workplans list             # List available plan templates
npx workplans add <template>   # Add a template to workplans/backlog/ with a fresh id
```

### Update ownership

`update` replaces system files only: `RULES.md` and the state-folder READMEs. The root `workplans/README.md` is user-owned after init — since framework 0.5.0, project configuration lives in `workplans/settings.yml`, not in the README — so `update` creates it only when missing and never overwrites it. One-time migrations run automatically before system files are replaced: a `work_on` still declared in `RULES.md` (pre-0.4.0 layout) moves forward, and on a 0.5.0+ framework the README-frontmatter constants and `LOCAL.yml` move into `settings.yml`/`settings.local.yml`, with the gitignore entry covered.

### Migrate

`migrate` brings plans written against an older format up to the version installed in `RULES.md`, applying the documented transition for each version pair — for 0.4.x → 0.5.0: attribution renamed to `planner`/`executor`, triage fields moved below the dates, and the `## Brief` migration placeholder inserted. Content sections are preserved verbatim.

- Scope: `backlog/` by default; `doing/` only with `--doing`; `done/` is never migrated (historical record).
- `--dry-run` lists what would change without writing.

### Templates

`add` copies a ready-made plan from the [template catalog](https://github.com/agnostical/workplans/tree/main/templates) into your backlog, rewriting its frontmatter: a fresh timestamp id (collision-safe), `state: "backlog"`, `backlog_date` now, and the format matching your local RULES.md (on a 0.4.0+ framework the template is migrated to the current contract as it lands). Phase 1: Definition arrives unchecked on purpose — refine the plan against your real project before executing it. Adding the same template twice is refused (non-destructive). See the [catalog README](https://github.com/agnostical/workplans/tree/main/templates#contributing-a-template) to contribute new templates.

### Flags

- `-h`, `--help` — show usage
- `-V`, `--version` — show version
- `migrate`: `--doing` (include work-in-progress plans), `--dry-run`
- `validate`: `--stale-days=N` (stale-backlog lint threshold, default 90)

## Versioning

This CLI tool versions independently from the Workplans framework format spec. `workplans@0.4.x` is a CLI release; the framework format is versioned in [`RULES.md`](https://github.com/agnostical/workplans/blob/main/init/workplans/RULES.md) and bumped separately when the plan format changes.

## Links

- [Workplans framework repository](https://github.com/agnostical/workplans)
- [Issues](https://github.com/agnostical/workplans/issues)

## License

MIT
