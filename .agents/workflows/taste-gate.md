---
name: taste-gate
description: Run the tasteskill real-browser finish gate and consistency audit on current web pages.
---

# Workflow: /taste-gate

Audits the current project's web pages against the tasteskill 2.5 standards:

1. **Run consistency check**:
   ```bash
   node <skill>/scripts/consistency.mjs index.html
   ```
2. **Execute browser finish gate**:
   ```bash
   node <skill>/scripts/gate.mjs index.html
   ```
3. **Capture responsive multi-breakpoint screenshots**:
   ```bash
   node <skill>/scripts/shoot.mjs index.html
   ```
4. **Close gate if satisfied**:
   ```bash
   node <skill>/scripts/gate.mjs --done "Approved visual audit"
   ```

