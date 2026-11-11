---
name: motion-audit
description: "Audit existing animations and interaction design against Emil Kowalski, Jakub Krehel, and Jhey Tompkins motion principles. Detects AI-slop motion fingerprints and motion gaps."
---

# Motion Audit Workflow

Run this workflow to conduct a systematic motion and interaction audit on the current project.

## Step 1: Reconnaissance
1. Identify the project type from `package.json`, layout, and component types (productivity tool, consumer app, creative showcase, etc.).
2. Scan existing animation definitions in CSS/SCSS, Tailwind config, and Framer Motion components.
3. Perform **Motion Gap Analysis**:
   - Check conditional renders `{condition && <Component />}`.
   - Check state switches without transitions.
   - Check modal/dialog mounting without exit animations.

## Step 2: Quality Gate & Anti-AI-Slop Check
Evaluate existing animations against `anti-checklist.md`:
- Flag infinite pulse animations on static elements.
- Flag blanket `hover:scale-105` spam.
- Flag uncalibrated bouncy springs on utility actions.
- Flag animations triggering layout thrashing (`width`, `height`, `top`).
- Check `prefers-reduced-motion` compliance across all stylesheets.

## Step 3: Perspective Weighting & Report
Present findings categorized by:
- **Critical**: Missing accessibility (`prefers-reduced-motion`), layout-thrashing animations, broken exit states.
- **Important**: AI-slop patterns, over-animated frequent actions, jarring motion gaps.
- **Suggestions**: Refined spring physics, easing improvements, micro-interaction polish.
