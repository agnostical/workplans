# Workplans

![version](https://img.shields.io/github/v/release/agnostical/workplans)

A framework for managing AI-driven work plans using structured Markdown files. Plans flow through a defined lifecycle (`draft` -> `backlog` -> `coding` -> `done`), with YAML frontmatter metadata that guides AI agents through task execution.

## Features

- **Zero setup** — Just a folder of Markdown files. No dependencies, no build steps, no accounts — drop it into any project and start planning
- **AI-agnostic** — Works with any AI agent or model; no vendor lock-in, no proprietary config files
- **Plan lifecycle** — Structured workflow with four states: draft, backlog, coding, done. Plans track their own state and progress, helping AI agents resume where work left off
- **Context-efficient structure** — Compact Markdown + YAML frontmatter keeps plans parseable and self-contained, reducing noise in the AI agent's context window
- **Built for collaboration** — Plans track authors, assignees, and AI models involved, keeping a clear record of who created and executed each plan
- **Visual progress board** — A live Kanban dashboard to track your AI agent's work in real time — just serve it locally and open your browser

## Quick start

### 1. Download the workplans folder

The easiest way to add Workplans to an existing project is using `giget` to download the ready to use folder:

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

No configuration files needed — just point your AI agent to the workplans folder. Two options depending on your setup:

**Option A: Quick Start (For new projects)**
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


### 3. Everyday usage

After setup, plans will be created and managed inside the `workplans/` folder. The interaction is simple — just prompt your AI agent in natural language:

```
Create a backlog plan for user authentication
```

```
Move the dashboard-redesign plan to coding
```

The agent will create plans, move them between states, and update progress as it works. See the [source of truth](init/workplans/README.md) inside the workplans folder for the complete template and rules.

## Progress board

The `workplans/progress/` folder includes an optional visual board that displays your plans as a Kanban-style dashboard organized by state. It is not required for the AI agent to work — the agent reads and manages plans directly from the Markdown files. The board is just a convenience for you to see the overall progress at a glance, with live polling that updates in real time as plans change.

To use it, serve the `workplans/` folder with any local HTTP server and open `progress/` in your browser. For example, using Python:

```bash
cd workplans && python3 -m http.server
```

Then open `http://localhost:8000/progress/`

## What gets scaffolded

| File | Purpose |
|------|---------|
| `workplans/README.md` | Source of truth for plan management: naming, frontmatter, template, and workflow rules |
| `workplans/{backlog,coding,done,draft}/README.md` | Per-folder rules and examples for each plan state |
| `workplans/progress/` | Visual Kanban board — serve via HTTP to visualize plans as cards by state |

## License

The MIT License (MIT)

Copyright (c) 2026 Agnostical

This framework was created with the assistance of artificial intelligence tools powered by large language models (LLMs) such as Claude, Gemini, GPT, Mistral, among others. The use of these tools has been carefully guided and supervised by the author of the project.
