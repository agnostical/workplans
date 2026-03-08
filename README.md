# Workplans

![version](https://img.shields.io/github/v/release/agnostical/workplans)

An open framework for managing AI-driven work plans using structured Markdown files, with YAML frontmatter metadata that guides AI agents through task execution. Plans flow through a defined lifecycle:

> **`Backlog` → `Doing` → `Done`**

## Features

- **Open source:** Fully open source under the MIT license. Free to use, modify, and distribute.
- **Zero setup:** Just a folder of Markdown files. No dependencies, no build steps, no accounts. Drop it into any project and start planning.
- **AI-agnostic:** Works with any AI agent or model; no vendor lock-in, no proprietary config files.
- **Plan lifecycle:** Structured workflow with three states: backlog, doing, done. Every plan starts with a mandatory definition phase, making progress visible from day one.
- **Unique IDs:** Each plan gets an immutable ID derived from the system clock (including ordinal day of the year + exact second of the day), preventing duplicates across teams and enabling conflict-free collaboration in shared repositories.
- **Context-efficient structure:** Compact Markdown + YAML frontmatter keeps plans parseable and self-contained, reducing noise in the AI agent's context window.
- **Built for collaboration:** Plans track authors, assignees, and AI models involved, keeping a clear record of who created and executed each plan.

## What is a plan?

A plan is a structured Markdown file with YAML frontmatter. It defines a unit of work for AI agents to create, track, and execute. Each plan lives in the folder matching its current state (backlog, doing, done).

The example below shows the required sections and field order. AI agents fill in the content automatically when creating a plan.

```markdown
---
id: 2606455842
title: "User authentication setup"
state: "backlog"
author: ""
author_model: ""
assignee: ""
assignee_model: ""
issue: ""
backlog_date: "YYYY-MM-DDThh:mm"
doing_date: ""
done_date: ""
---

# User authentication setup

## Progress §
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps

### Phase 2: Define auth strategy
- [ ] Choose authentication method
- [ ] Document security requirements

## Objective §
Brief description of what this plan aims to achieve and why.

## Context §
Relevant background, constraints, or references that inform the plan.

## Implementation §
### Phase 1: Definition
_No implementation needed — this phase tracks the completion of Objective §, Context §, and the definition of subsequent phases._

### Phase 2: Define auth strategy
Technical details, decisions, and approach for this phase.

## Closing Summary §
_To be written when the last phase is completed._
```

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

Both options give you the same ready-to-use folder with three state directories for your plans and a RULES.md that acts as the source of truth for your AI agent:

```
workplans/
├── backlog/       # Pending plans
├── doing/         # Work in progress
├── done/          # Completed plans
├── RULES.md       # Framework rules (source of truth)
└── README.md      # Auto-generated plan index
```

### 2. Connect Workplans to your AI Agent

With the folder in place, just point your AI agent to it and start working. Two options depending on your setup:

#### Option A: Direct prompt
If you don't have an AI instructions file in your project, open your AI agent (terminal, IDE, or native app) and paste this:

> *Prompt example*
```
Read workplans/RULES.md and create a plan for a TODO app
```

The agent will read the rules, then create a new Markdown plan file inside the `workplans/backlog/` folder.

#### Option B: AI instructions file
If you already have a `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, or similar AI instructions file, include this single line in it:

> *Add this instruction*
```
Manage tasks and plans by strictly following the rules defined in: workplans/RULES.md
```

Then just prompt your agent:

> *Prompt example*
```
Create a plan for a TODO app
```

The agent will create a new Markdown plan file inside the `workplans/backlog/` folder.

### 3. Everyday usage

Plans are created and managed inside `workplans/`. Just prompt your AI agent in natural language:

> *Prompt example*
```
Create a backlog plan for user authentication
```

> *Prompt example*
```
Move the dashboard-redesign plan to doing
```

The agent will create plans, move them between states, and update progress as it works. See the [RULES.md](init/workplans/RULES.md) inside the workplans folder for the complete template and rules.

## License

The MIT License (MIT)

Copyright (c) 2026 Agnostical

This framework was created with the assistance of artificial intelligence tools powered by large language models (LLMs) such as Claude, Gemini, GPT, Mistral, among others. The use of these tools has been carefully guided and supervised by the author of the project.
