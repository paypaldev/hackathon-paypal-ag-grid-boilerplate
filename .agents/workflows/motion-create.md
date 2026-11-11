---
name: motion-create
description: "Create purposeful UI micro-interactions, components, and enter/exit animations applying Emil Kowalski, Jakub Krehel, and Jhey Tompkins design principles."
---

# Motion Create Workflow

Run this workflow when creating or upgrading animated components.

## Step 1: Context & Frequency Check
1. Determine the trigger frequency of the component:
   - High frequency (frequent actions): Instant or < 120ms.
   - Normal UI: 180–300ms.
   - First-time / Hero: Rich, deliberate animation.
2. Select primary perspective:
   - Emil Kowalski for speed and restraint.
   - Jakub Krehel for subtle consumer elegance.
   - Jhey Tompkins for playful experimentation and novel CSS.

## Step 2: Recipe Selection
Select battle-tested recipes from `references/motion-cookbook.md`:
- Enter: `opacity` (0 -> 1) + `translateY` (8px -> 0) + optional subtle `blur` (4px -> 0).
- Exit: Faster duration (60-80% of enter), fade out first.
- Springs: High stiffness (300–400), critical damping (30–35), no lingering bounce on utility controls.

## Step 3: Implementation & Validation
1. Use GPU-only properties (`transform`, `opacity`, `filter`).
2. Implement explicit `prefers-reduced-motion` fallbacks.
3. Verify interactive states (`hover`, `active`, `focus-visible`).
