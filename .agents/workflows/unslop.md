---
description: "Audit and redesign any screen, component, or live URL to eliminate AI slop and establish authentic product craft."
---

# /unslop Workflow

Use this workflow to transform vibecoded, AI-generated interfaces into polished, bespoke software.

## Triggering the Workflow

Run via slash command or conversational request:
- `/unslop` or `/unslop <file-path>`
- `/unslop <url>`
- "Unslop this dashboard"
- "Audit and polish this landing page hero"

## Execution Steps

1. **Inspection & Capture**:
   - For code files: locate the component, template, and style sheets.
   - For live links: run `node <unslop-plugin>/skills/unslop/scripts/snapshot.mjs <url> unslop/original.html`.
2. **Redline Audit (`unslop-reviewer`)**:
   - Identify slop indicators across color, type, icons, spacing, copy, and visuals.
   - Output structured redline table with exact line numbers and remedies.
3. **Establish Direction (`unslop-designer`)**:
   - Determine product character, quiet chrome palette, one focal element, and signature detail.
4. **Execute 8 Craft Passes**:
   - Spacing -> Color -> Icons -> Copy -> Type -> Layout -> Details -> Visuals.
5. **Verification**:
   - Inspect output in browser or preview.
   - Optional: generate unslop story video comparing before/after with `node <unslop-plugin>/skills/unslop/scripts/story.mjs`.

