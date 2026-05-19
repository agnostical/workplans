# workplans

CLI for the [Workplans framework](https://github.com/agnostical/workplans) — install and update markdown plan structures for AI agents.

## Install

```bash
npx workplans init
```

This scaffolds a `workplans/` folder in the current directory with `RULES.md`, `README.md`, and the `backlog/`, `doing/`, `done/` state folders.

## Commands

```bash
npx workplans init     # Scaffold the framework (fails if workplans/ already exists)
npx workplans update   # Refresh RULES.md and README.md, ensure state folders exist
                       # User plans are never touched
```

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
