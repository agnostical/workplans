---
id: 2604655800
title: "Dark mode design system"
state: "backlog"
author: "sebastianserna"
author_model: "gpt-4o"
assignee: ""
assignee_model: ""
backlog_date: "2026-02-15T15:30"
doing_date: ""
done_date: ""
---

# Dark mode design system

## Progress
### Phase 1: Definition
- [ ] Define objective and context
- [ ] Define phases and steps

### Phase 2: Design tokens
- [ ] Define semantic color tokens (background, surface, text, border)
- [ ] Create dark palette based on existing brand colors
- [ ] Implement theme toggle with Tailwind `class` strategy

### Phase 3: Component migration
- [ ] Update core UI components to use semantic tokens
- [ ] Add user preference persistence (localStorage)

## Objective
Add dark mode support to the application. Users have requested it and it improves accessibility and reduces eye strain in low-light environments.

## Context
The app currently uses hardcoded colors. We already use Tailwind CSS, which has native dark mode support via the `class` strategy. Need to define semantic color tokens before implementation.

## Implementation
### Phase 1: Definition
This phase tracks the definition of Objective, Context, and subsequent phases.

### Phase 2: Design tokens

Define CSS custom properties for semantic colors (`--color-bg`, `--color-surface`, `--color-text-primary`, etc.) and map them to Tailwind's dark mode classes. Toggle via a `.dark` class on `<html>`.

### Phase 3: Component migration

Replace hardcoded color classes (`bg-white`, `text-gray-900`) with semantic tokens across all components. Store user preference in localStorage and respect `prefers-color-scheme` as default.

## Closing Summary
To be written when the last phase is completed.
