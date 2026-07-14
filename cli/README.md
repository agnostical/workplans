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
npx workplans list             # List available plan templates
npx workplans add <template>   # Add a template to workplans/backlog/ with a fresh id
```

### Update ownership

`update` replaces system files only: `RULES.md` and the state-folder READMEs. The root `workplans/README.md` is user-owned after init — it carries the project constants (`work_on`, `tracker`, `estimate_scale`) in its frontmatter — so `update` creates it only when missing and never overwrites it. If your `RULES.md` still declares `work_on` (pre-0.4.0 layout), `update` moves it into the README frontmatter automatically before replacing `RULES.md`.

### Migrate

`migrate` brings plans written against an older format up to the version installed in `RULES.md`, applying the documented transition for each version pair (for 0.3.x → 0.4.0: field reorder, `format_version` → `format` rename, new empty fields, bare `relations:` key). Content sections are preserved verbatim.

- Scope: `backlog/` by default; `doing/` only with `--doing`; `done/` is never migrated (historical record).
- `--dry-run` lists what would change without writing.

### Templates

`add` copies a ready-made plan from the [template catalog](https://github.com/agnostical/workplans/tree/main/templates) into your backlog, rewriting its frontmatter: a fresh timestamp id (collision-safe), `state: "backlog"`, `backlog_date` now, and the format matching your local RULES.md (on a 0.4.0+ framework the template is migrated to the current contract as it lands). Phase 1: Definition arrives unchecked on purpose — refine the plan against your real project before executing it. Adding the same template twice is refused (non-destructive). See the [catalog README](https://github.com/agnostical/workplans/tree/main/templates#contributing-a-template) to contribute new templates.

### Flags

- `-h`, `--help` — show usage
- `-V`, `--version` — show version

## Versioning

This CLI tool versions independently from the Workplans framework format spec. `workplans@0.1.x` is a CLI release; the framework format is versioned in [`RULES.md`](https://github.com/agnostical/workplans/blob/main/init/workplans/RULES.md) and bumped separately when the plan format changes.

## Links

- [Workplans framework repository](https://github.com/agnostical/workplans)
- [Issues](https://github.com/agnostical/workplans/issues)

## License

MIT
