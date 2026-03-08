# Plans

Plans are structured Markdown files that move through three states: **Backlog** → **Doing** → **Done**. Each state has a corresponding folder. Browse each folder to see its plans.

To create a new plan, ask your AI agent. For example:

> _Create a plan for implementing user authentication with OAuth2_

The agent will follow the rules defined in [RULES.md](RULES.md) to generate the plan file and place it in `backlog/`. As work progresses, the agent moves the file to the corresponding folder and updates its metadata.

| State | Folder | Description |
|-------|--------|-------------|
| Backlog | [backlog/](backlog/) | Pending plans, waiting for definition or execution |
| Doing | [doing/](doing/) | Plans in progress, currently being implemented |
| Done | [done/](done/) | Completed and closed plans |
