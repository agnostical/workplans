---
plan: "Dark mode design system"
state: "draft"
author: "sebastianserna"
author_model: "gpt-4o"
assignee: ""
assignee_model: ""
issue: ""
draft: "2026-02-15T15:30"
backlog: ""
doing: ""
done: ""
tags: "design, ui"
---

# Dark mode design system

## Progress

### Phase 1: Design tokens
- [ ] Define semantic color tokens (background, surface, text, border)
- [ ] Create dark palette based on existing brand colors
- [ ] Implement theme toggle with Tailwind `class` strategy

### Phase 2: Component migration
- [ ] Update core UI components to use semantic tokens
- [ ] Add user preference persistence (localStorage)

## Objective

Add dark mode support to the application. Users have requested it and it improves accessibility and reduces eye strain in low-light environments.

## Context

The app currently uses hardcoded colors. We already use Tailwind CSS, which has native dark mode support via the `class` strategy. Need to define semantic color tokens before implementation.

## Implementation

### Phase 1: Design tokens

Define CSS custom properties for semantic colors (`--color-bg`, `--color-surface`, `--color-text-primary`, etc.) and map them to Tailwind's dark mode classes. Toggle via a `.dark` class on `<html>`.

### Phase 2: Component migration

Replace hardcoded color classes (`bg-white`, `text-gray-900`) with semantic tokens across all components. Store user preference in localStorage and respect `prefers-color-scheme` as default.
