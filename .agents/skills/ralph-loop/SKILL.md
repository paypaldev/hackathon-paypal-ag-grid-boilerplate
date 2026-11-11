---
name: ralph-loop
description: "Execute the Ralph autonomous agent loop on prd.json. Implements user stories one-by-one with fresh context, verifies with typecheck/tests, commits, updates progress.txt and AGENTS.md, and repeats until all tasks pass. Triggers on: run ralph loop, execute ralph, start ralph iteration, build prd.json, run ralph."
user-invocable: true
---

# Ralph Loop Execution Skill

Autonomous execution engine for PRDs structured via Ralph (`prd.json`). Executes user stories iteratively with clean context, verifiable quality checks, persistent learnings, and atomic commits.

---

## Prerequisites

1. `prd.json` must exist in the workspace or scripts directory with structured `userStories`.
2. Git repository initialized on the feature branch specified in `prd.json` (`branchName`).
3. Quality check commands identified (e.g., `npm run typecheck`, `npm test`, `pytest`, `cargo test`, etc.).

---

## Execution Workflow (Per Iteration)

### Step 1: Context & Branch Verification
1. Read `prd.json` to inspect the project name, `branchName`, and `userStories`.
2. Read `progress.txt` (especially the `## Codebase Patterns` section at the top).
3. Verify git status and current branch:
   - If not on `branchName`, check it out or create it from main/current branch:
     ```bash
     git checkout -b <branchName>
     ```

### Step 2: Select Next Story
1. Identify all stories where `"passes": false`.
2. Select the story with the **highest priority** (lowest numerical priority value, e.g., 1 before 2).
3. If all stories have `"passes": true`, output:
   ```
   <promise>COMPLETE</promise>
   ```
   and terminate execution.

### Step 3: Implement Story
1. Focus strictly on the single selected story (`US-XXX`).
2. Adhere to all acceptance criteria specified in the story.
3. Keep changes minimal, focused, and clean. Never implement multiple stories at once.

### Step 4: Quality & Verification Checks
1. Run project quality checks:
   - Typechecking (e.g. `npm run typecheck` / `tsc --noEmit`)
   - Unit/Integration tests (e.g. `npm test`, `pytest`, etc.)
   - Linting (if configured)
2. **For UI Stories:** If acceptance criteria require browser verification, use available browser tools/Playwright/DevTools to verify UI rendering and interactions.
3. If checks fail, diagnose and fix until all checks pass. Never commit broken code.

### Step 5: Document Learnings
1. Check if any reusable architectural conventions or patterns were discovered. If so, add them to `## Codebase Patterns` at the top of `progress.txt` and relevant `AGENTS.md` / `GEMINI.md` files.
2. Append iteration report to `progress.txt` (never overwrite, always append):
   ```markdown
   ## [Date/Time] - [Story ID]: [Story Title]
   - Implemented: [Brief summary of implementation]
   - Files changed: [List of modified/added files]
   - Verification: [Typecheck/tests output summary]
   - **Learnings for future iterations:**
     - Patterns discovered: [Any new conventions]
     - Gotchas encountered: [Any edge cases or traps avoided]
   ---
   ```

### Step 6: Commit Changes
1. Stage all changes associated with the story:
   ```bash
   git add .
   ```
2. Commit with conventional commit format:
   ```bash
   git commit -m "feat: [Story ID] - [Story Title]"
   ```

### Step 7: Update `prd.json`
1. Update the story in `prd.json` to mark `"passes": true`.
2. Save `prd.json`.

### Step 8: Next Iteration or Completion
1. Check remaining stories in `prd.json`.
2. If all stories pass:
   ```
   <promise>COMPLETE</promise>
   ```
3. If more stories remain, report completion of the current story and proceed to the next story.
