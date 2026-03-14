# AGENTS.md

Agent-agnostic instructions for this repository. Tool-specific files (CLAUDE.md, .cursor/rules, etc.) point here.

## About this repo

This is the **public framework repository** for [Workplans](https://github.com/agnostical/workplans). It contains the framework definition (RULES.md, templates, scripts, examples) and is the target for code execution.

## Internal development plans

Internal development plans for this project are managed in a separate private repository: https://github.com/agnostical/workplans-dev

**Do not create development plans in this repo.** If asked to create, edit, or manage internal plans, direct the user to work from `workplans-dev`.

The `workplans/` folder in this repo contains **demo/example plans** that are part of the framework — not internal development plans.

## Git workflow

- Main branch: `main` (protected, PRs required)
- Branches: `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`, `docs/` + description in English
- Commits: Conventional Commits in English (`feat:`, `fix:`, `docs:`, etc.)
- PRs: title in English (Conventional Commits), body/description in English
- Issues: title and description in English
- **Do not include** `Co-Authored-By` from AI agents in commits
- **Do not include** "Generated with Claude Code" links in commit messages or PRs
