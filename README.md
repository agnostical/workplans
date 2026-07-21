# Workplans

![version](https://img.shields.io/github/v/release/agnostical/workplans?filter=v*)

An open framework for managing AI-driven work plans using structured Markdown files, with YAML frontmatter metadata that guides AI agents through task execution. Plans flow through a defined lifecycle:

> **`Backlog` → `Doing` → `Done`**

## Features

- **Open source:** Fully open source under the MIT license. Free to use, modify, and distribute.
- **Zero setup:** Just a folder of Markdown files. No dependencies, no build steps, no accounts. Drop it into any project and start planning — zero config to start, one optional settings file when the team or the portfolio grows.
- **AI-agnostic:** Works with any AI agent or model; no vendor lock-in, no proprietary config files.
- **Plan lifecycle:** Structured workflow with three states: backlog, doing, done. Every plan starts with a mandatory definition phase, making progress visible from day one.
- **Unique IDs:** Each plan gets an immutable ID derived from the system clock (including ordinal day of the year + exact second of the day), preventing duplicates across teams and enabling conflict-free collaboration in shared repositories.
- **Context-efficient structure:** Compact Markdown + YAML frontmatter keeps plans parseable and self-contained, reducing noise in the AI agent's context window.
- **Built for collaboration:** Plans track planners, executors, and the AI models involved, keeping a clear record of who defined and executed each plan. There is deliberately no requester field: the requester's identity lives in the tracker, and their words live in the plan itself.
- **Tracker-ready:** Typed relations, priority, estimates with a declarable scale, and a sync contract that lets plans mirror into Linear, Jira, or GitHub without giving up the markdown as the source of truth.
- **Extensible:** Optional extensions can be installed inside the workplans folder.

## What is a plan?

A plan is a structured Markdown file with YAML frontmatter. It defines a unit of work for AI agents to create, track, and execute. Each plan lives in the folder matching its current state (backlog, doing, done).

The example below shows the required sections and field order. AI agents fill in the content automatically when creating a plan.

```markdown
---
format: "0.5.0"
id: 2606455842
title: "User authentication setup"
planner: ""
planner_model: ""
executor: ""
executor_model: ""
state: "backlog"
backlog_date: "YYYY-MM-DDThh:mm"
doing_date: ""
done_date: ""
priority: ""
estimate: ""
tracked_in: ""
relations:
---

# User authentication setup

## Brief
Two to four plain-language sentences: what was asked and what for, in the requester's intent.

## Objective
One focused paragraph: what this plan delivers, what for, and its scope boundary.

## Progress
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps
- [ ] Refine with the user

### Phase 2: Define auth strategy
- [ ] Choose authentication method
- [ ] Document security requirements

### Phase 3: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Context
Relevant background, constraints, or references that inform the plan.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Define auth strategy
Technical details, decisions, and approach for this phase.

### Phase 3: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
```

## Quick start

### 1. Download the workplans folder

#### Option A: With the workplans CLI (recommended)
If you have Node.js installed, open the terminal in your project folder and run:

```bash
npx workplans init
```

This is non-destructive — it fails with a clear error if a `workplans/` folder already exists in the current directory. To refresh `RULES.md` and `README.md` later when a new framework release ships, run:

```bash
npx workplans update
```

`update` refreshes only the framework system files. Your plans inside `backlog/`, `doing/`, and `done/` are never touched, and neither is the root `workplans/README.md` — it is yours after init; project configuration lives in `workplans/settings.yml`. After updating across a format release, bring your plans up to the new format with:

```bash
npx workplans migrate
```

`migrate` covers `backlog/` by default (`--doing` opts in work-in-progress plans; `done/` is never migrated) and supports `--dry-run`.

#### Option B: From GitHub
Download the `.zip`, extract it, and copy the `workplans` folder (inside `init/`) into your project.

[![Download latest release](https://img.shields.io/github/v/release/agnostical/workplans?filter=v*&label=Download&style=for-the-badge&logo=github)](https://github.com/agnostical/workplans/releases)

#### Option C: Using giget directly
If you prefer not to install the CLI, you can use `giget`:

```bash
npx giget gh:agnostical/workplans/init . --force
```

Note: this overwrites all files unconditionally, including existing plans. Use Option A for safer updates.

All three options give you the same ready-to-use folder with three state directories for your plans and a RULES.md that acts as the source of truth for your AI agent:

```
workplans/
├── backlog/       # Pending plans
├── doing/         # Work in progress
├── done/          # Completed plans
├── extend/        # Optional extensions (created on demand)
├── README.md      # General info
└── RULES.md       # Framework rules (source of truth)
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
Create a plan for user authentication
```

> *Prompt example*
```
Move the dashboard-redesign plan to doing
```

The agent will create plans, move them between states, and update progress as it works. See the [RULES.md](init/workplans/RULES.md) inside the workplans folder for the complete template and rules.

## Extensions

Optional extensions can be installed in `workplans/extend/`. For example, the [visual board](https://github.com/agnostical/board) provides a Kanban-style dashboard:

```bash
npx giget gh:agnostical/board workplans/extend/board
```

## License

The MIT License (MIT)

Copyright (c) 2026 Agnostical

This framework was created with the assistance of artificial intelligence tools powered by large language models (LLMs) such as Claude, Gemini, GPT, Mistral, among others. The use of these tools has been carefully guided and supervised by the author of the project.
