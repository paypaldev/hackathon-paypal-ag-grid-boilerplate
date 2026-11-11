# Ralph Rules & Guidelines

## 1. Context Freshness
- Stories should be right-sized so they fit comfortably within a single context window.
- If a story is too large (e.g. "implement entire auth"), split it into smaller stories (schema, auth service, login UI, session guards).
- If you cannot describe the story in 2-3 sentences, it is too big.

## 2. Story Ordering & Dependencies
- Stories execute strictly in priority order.
- Always order dependencies first:
  1. Schema and database models / migrations
  2. Backend APIs / services / business logic
  3. UI components using the services
  4. Dashboards and aggregation views

## 3. Verifiable Acceptance Criteria
- Every story MUST have verifiable criteria (e.g., "Add column status to tasks table", "Filter dropdown includes All, Active, Completed").
- Every story MUST include "Typecheck passes".
- Every story with testable business logic MUST include "Tests pass".
- Every UI story MUST include "Verify in browser using dev-browser skill" (or equivalent browser tool).

## 4. Atomic Commits
- Commit after every completed story.
- Format: `feat: [Story ID] - [Story Title]`.
- Never commit failing typechecks or broken tests.

## 5. Persistent Memory via AGENTS.md & progress.txt
- Future iterations read `progress.txt` and `AGENTS.md` before executing.
- Always document reusable patterns, gotchas, and configuration quirks discovered during an iteration.
