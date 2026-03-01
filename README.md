# Workplans

![version](https://img.shields.io/github/v/release/agnostical/workplans)

A framework for managing AI-driven work plans using structured Markdown files, with YAML frontmatter metadata that guides AI agents through task execution. Plans flow through a defined lifecycle:

> **`Draft` → `Backlog` → `Doing` → `Done`**

## Features

- **Zero setup:** Just a folder of Markdown files. No dependencies, no build steps, no accounts. Drop it into any project and start planning
- **AI-agnostic:** Works with any AI agent or model; no vendor lock-in, no proprietary config files
- **Plan lifecycle:** Structured workflow with four states: draft, backlog, doing, done. Plans track their own state and progress, helping AI agents resume where work left off
- **Context-efficient structure:** Compact Markdown + YAML frontmatter keeps plans parseable and self-contained, reducing noise in the AI agent's context window
- **Built for collaboration:** Plans track authors, assignees, and AI models involved, keeping a clear record of who created and executed each plan
- **Visual progress board:** A live Kanban dashboard to track your AI agent's work in real time. Just serve it locally and open your browser

## Quick start

### 1. Download the workplans folder

#### Option A: From GitHub
Download the `.zip`, extract it, and copy the `workplans` folder (inside `init/`) into your project.

[![Download latest release](https://img.shields.io/github/v/release/agnostical/workplans?label=Download&style=for-the-badge&logo=github)](https://github.com/agnostical/workplans/releases/latest)

#### Option B: Using the terminal
If you have Node.js installed, open the terminal in your project folder and run:

```bash
npx giget gh:agnostical/workplans/init . --force
```

Both options give you the same ready-to-use folder with four state directories for your plans, a visual progress board, and a README that acts as the source of truth for your AI agent:

```
workplans/
├── backlog/                  # Pending plans
├── doing/                    # Work in progress
├── done/                     # Completed plans
├── draft/                    # Drafts, ideas, and decisions
├── progress/                 # Visual board (optional)
└── README.md                 # Plan management rules (source of truth)
```

### 2. Connect Workplans to your AI Agent

With the folder in place, just point your AI agent to it and start working. Two options depending on your setup:

#### Option A: Direct prompt
If you don't have an AI instructions file in your project, open your AI agent (terminal, IDE, or native app) and paste this:

> *Prompt example*
```
Read workplans/README.md and create a draft plan for a TODO app
```

The agent will read the rules, then create a new Markdown plan file inside the `workplans/draft/` folder.

#### Option B: AI instructions file
If you already have a `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, or similar AI instructions file, include this single line in it:

> *Add this instruction*
```
Manage tasks and plans by strictly following the rules defined in: workplans/README.md
```

Then just prompt your agent:

> *Prompt example*
```
Create a draft plan for a TODO app
```

The agent will create a new Markdown plan file inside the `workplans/draft/` folder.

### 3. Everyday usage

After setup, plans will be created and managed inside the `workplans/` folder. As shown in the examples above, just prompt your AI agent in natural language:

> *Prompt example*
```
Create a backlog plan for user authentication
```

> *Prompt example*
```
Move the dashboard-redesign plan to doing
```

The agent will create plans, move them between states, and update progress as it works. See the [source of truth](init/workplans/README.md) inside the workplans folder for the complete template and rules.

## Progress board

The `workplans/progress/` folder includes a visual board that displays your plans as a Kanban-style dashboard organized by state. It is not required for the AI agent to work. The agent reads and manages plans directly from the Markdown files. The board is just a convenience for you to see the overall progress at a glance, with live polling that updates in real time as plans change.

To use it, serve the `workplans/` folder with any local HTTP server and open `progress/` in your browser. For example, using Python:

```bash
cd workplans && python3 -m http.server
```

Then open `http://localhost:8000/progress/`

## License

The MIT License (MIT)

Copyright (c) 2026 Agnostical

This framework was created with the assistance of artificial intelligence tools powered by large language models (LLMs) such as Claude, Gemini, GPT, Mistral, among others. The use of these tools has been carefully guided and supervised by the author of the project.
