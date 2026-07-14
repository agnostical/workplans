# Plan templates

Ready-to-execute plan templates for common processes. Users add them to their backlog with:

```bash
npx workplans list             # see this catalog
npx workplans add <template>   # copy one into workplans/backlog/ with a fresh id
```

`add` rewrites the frontmatter on the way in: new timestamp `id`, `state: "backlog"`, `backlog_date` now, and the format matching the user's local RULES.md — on a 0.4.0+ framework the template is migrated to the current contract (field order, `format` first, triage and sync fields) as it lands. Phase 1: Definition arrives unchecked on purpose — every template must be refined against the real project before execution (that is the entry gate).

## Contributing a template

1. Create `templates/<name>.md` — the kebab-case filename is the template id.
2. The file is a complete, valid plan per [RULES.md](../init/workplans/RULES.md): five H2 sections in the current order (Objective first), mandatory Phase 1: Definition and Closing phase, no emojis. Use placeholder values in the frontmatter (`id: 0000000000`, empty dates) — the CLI rewrites them and migrates the frontmatter to the installed format on the way in.
3. Write the Context section as instructions for replacement: what the user should fill in during Phase 1.
4. Steps an AI agent cannot execute (browser checks, credential configuration) carry the `[manual]` prefix.
5. Add an entry to `index.json` with `name`, `title` (must match the plan title) and a one-line `description`.
6. Templates are in English; users' agents translate phase names and step text per rule 27 when refining.
