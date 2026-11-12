---
name: taste
description: Build or redesign a company website or landing page at the figma.com and x.ai visual bar using tasteskill 2.5 anti-slop system.
---

# Workflow: /taste

Build or redesign a company website, SaaS landing page, product showcase, or marketing site following the tasteskill 2.5 anti-slop standard:

> **Resolution Note:** In any project built with Antigravity IDE, `<skill>` resolves to `.agents/skills/design-taste-frontend` (or globally `~/.gemini/config/skills/design-taste-frontend`).

## 1. Discovery & Arming
1. Identify the site kind:
   - `software`: App, SaaS, AI, developer tool, fintech
   - `gaming`: Video games, studios
   - `tech`: Hardware, robotics, devices
   - `product` / `service` / `place`: Physical products, services, hospitality, cafes, shops
2. Determine what is sold, who buys it, and the primary transaction (CTA).
3. Arm the tasteskill finish gate:
   ```bash
   node <skill>/scripts/gate.mjs --start index.html --kind <kind> --category "<what is sold>" --primary "<main action>"
   ```

## 2. Deal System & Tokens
1. Deal color palette, typography pairing, and theme tokens:
   ```bash
   node <skill>/scripts/start.mjs deal --page <kind> --trade "<trade>" --history .taste-skill/history.json
   ```
2. Deal hero layout:
   ```bash
   node <skill>/assets/layout/deal.mjs --type <kind> --has photo,ui --history .taste-skill/layout-history.json
   ```
3. Deal bespoke interactive moment(s):
   ```bash
   node <skill>/scripts/moments.mjs deal --page <kind>
   ```

## 3. Assets & Real Media
- Fetch authentic licensed photographs:
  ```bash
  node <skill>/scripts/photos.mjs search "<query>"
  ```
- Fetch official vector brand and tool icons:
  ```bash
  node <skill>/scripts/icons.mjs search "<tool>"
  ```

## 4. Implementation
- Build sections with one idea per screen (1440x900 viewport basis).
- Enforce equal left and right container alignment.
- Apply micro-interactions: 2px card hover lift, 1.02-1.03 photo frame zoom, button tactile clicks.
- Apply shader effects only if kind is tech, gaming, software, or dev tools.

## 5. Verification Gate
1. Run consistency check:
   ```bash
   node <skill>/scripts/consistency.mjs index.html
   ```
2. Run headless browser finish gate:
   ```bash
   node <skill>/scripts/gate.mjs index.html
   ```
3. Capture screenshots at 1440, 1024, 768, and 390:
   ```bash
   node <skill>/scripts/shoot.mjs index.html
   ```

