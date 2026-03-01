# Workplans

A framework for managing AI-driven work plans using structured Markdown files. Plans flow through a defined lifecycle (`draft` -> `backlog` -> `coding` -> `done`), with YAML frontmatter metadata and a standardized template that guides AI agents through task execution.

## Features

- **Plan lifecycle** — Structured workflow with four states: draft, backlog, coding, done
- **Standardized template** — YAML frontmatter + Markdown body with progress tracking, objectives, and implementation details
- **Strict file rules** — Only structured plan files are allowed inside `workplans/`, preventing loose or unstructured content
- **Visual progress board** — Kanban board (`progress/index.html`) that renders plans as cards with progress rings, dark mode, and live polling
- **100% framework-agnostic** — No custom configuration files pollute your root directory; `workplans/README.md` is the single source of truth for AI agents

## Quick start

### 1. Download the workplans folder

The easiest way to add Workplans to an existing project is using `giget` to download the boilerplate framework:

```bash
npx giget gh:agnostical/workplans/init . --force
```

This copies the `workplans` folder into your current directory:

```
workplans/
├── backlog/                  # Pending plans
├── coding/                   # Work in progress
├── done/                     # Completed plans (archive)
├── draft/                    # Drafts, ideas, and decisions
├── progress/                 # Visual board to view plans by state
└── README.md                 # Plan management rules (source of truth)
```

Alternatively, you can manually copy the `init/workplans` folder from the [GitHub repo](https://github.com/agnostical/workplans) into your project root. Just paste it and it's ready to use.

### 2. Connect Workplans to your AI Agent

Since Workplans is 100% agnostic, it doesn't pollute your root directory with custom configuration files. You have two ways to activate the framework depending on your setup:

**Option A: Zero-Config Quick Start (For new projects)**
If you don't have any AI configuration files, just open your terminal/IDE with your AI agent and paste this exact prompt:

```
Read workplans/README.md and create a draft plan for a TODO app
```

**Option B: For existing projects (Cursor, Claude Code, Aider)**
If you already have a `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, or AI instructions file, simply add this single line to it:

```
Manage tasks and plans by strictly following the rules defined in: workplans/README.md
```

Then just prompt your agent:

```
Create a draft plan for a TODO app
```


## What gets scaffolded

| File | Purpose |
|------|---------|
| `workplans/README.md` | Source of truth for plan management: naming, frontmatter, template, and workflow rules |
| `workplans/{backlog,coding,done,draft}/README.md` | Per-folder rules and examples for each plan state |
| `workplans/progress/` | Visual Kanban board — serve via HTTP to visualize plans as cards by state |


## Usage

After scaffolding, connect Workplans to your AI agent using one of the options above. Then start creating plans:

```bash
# Create a new plan in the backlog
touch workplans/backlog/BACKLOG-2026-02-27-youruser_feature-name.md
```

Each plan follows a naming format: `TYPE-YYYY-MM-DD-author_description.md`

See [workplans/README.md](init/workplans/README.md) for the complete template and rules.

## License

The MIT License (MIT)

Copyright (c) 2026 - Sebastian Serna

This framework was created with the assistance of artificial intelligence tools powered by large language models (LLMs) such as Claude, Gemini, GPT, Mistral, among others. The use of these tools has been carefully guided and supervised by the author of the project.
