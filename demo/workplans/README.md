# Plans

This file describes the workflow states used to organize plans. Each state corresponds to a folder where plan files are stored. Browse each folder to see its plans.

| State | Folder | Description |
|-------|--------|-------------|
| Backlog | [backlog/](backlog/) | Plans pending, waiting for definition or execution |
| Doing | [doing/](doing/) | Plans in progress, currently being implemented |
| Done | [done/](done/) | Plans completed and closed |

Plans move through these states as they progress from idea to completion. State transitions are handled by AI agents following the rules defined in [RULES.md](RULES.md). The agent moves the file to the corresponding folder and updates the plan's metadata accordingly.

To create a new plan, ask your AI agent. For example:

> _Create a plan for implementing user authentication with OAuth2_

The agent will follow the rules to generate the plan file with the correct format and place it in `backlog/`.
