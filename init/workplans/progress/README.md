# Workplans Progress

A single-file Kanban board that renders workplan Markdown files as cards organized by state: **Draft**, **Backlog**, **Coding**, and **Done**.

## How to use

Serve `workplans/` via HTTP and open `progress/` in a browser:

```
cd workplans
python3 -m http.server 8000
# Open http://localhost:8000/progress/
```

## Directory structure compatibility

The board auto-detects the folder layout (no configuration needed):

- **Subfolders mode:** Plans in state-specific subfolders (`draft/`, `backlog/`, `coding/`, `done/`). Detected when any subfolder responds HTTP 200.
- **Flat mode:** All plan files alongside `progress/` without subfolders. Activated when no state subfolders exist. State resolved from frontmatter `state` field → filename prefix → fallback `draft`.
- **Mixed mode:** Subfolders exist but some files are in the root. Both locations are scanned; duplicates are skipped.

## How it works

- Discovers `.md` files via HTTP directory listings (parses `<a>` tags). Excludes `README.md` and hidden files.
- Extracts YAML frontmatter for metadata (title, state, author, tags, dates).
- Cards show: title, progress ring (from checkboxes), author, date, tags.
- Clicking a card opens a side panel with full rendered Markdown.
- Polls every 3 seconds; only re-renders on changes.

## Features

- Dark mode toggle (saved in localStorage)
- Deep linking via URL hash (`#author_description`, stable across transitions)
- Styled comment blocks from `## Comments` sections
- Responsive: 1 column mobile, 2 tablet, 4 desktop
