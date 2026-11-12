# Taste-Driven Frontend Design Standards (tasteskill 2.5)

## Purpose & Scope

Defines the non-negotiable frontend engineering and design rules for all web pages, landing pages, SaaS dashboards, and marketing sites built in Antigravity IDE. Enforces the visual quality standard of **figma.com** and **x.ai**, eliminating generic AI templates, slop, and low-craft layouts.

## The 9 House Rules (Absolute Precedence)

1. **No Captions Under Visuals**: No text describing or explaining images/renders. License credits live strictly in a single unobtrusive footer line.
2. **All Visuals Render Robustly**: Every image, diagram, UI card, and canvas element must render without broken links or empty spaces across 1440px, 1024px, 768px, and 390px.
3. **One Section Per Screen**:
   - The hero stands alone on screen one at 1440x900.
   - Every following section is exactly 1 or 2 screens tall.
   - Headings of subsequent sections must never peek into the current viewport fold.
4. **Equal Left and Right Edges**: Strict vertical alignment to container boundaries. Uniform padding and zero ragged column breaks.
5. **Quiet Hover Micro-Animations**:
   - Interactive cards elevate by 2px on hover.
   - Photos zoom smoothly by 1.02-1.03 within overflow-hidden frames.
   - Buttons provide tactile feedback: step on hover, scale down on click (`active:scale-[0.98]`).
   - Card loops cycle smoothly (2.5-4s duration) and pause or restart on hover.
   - Every page features a load entrance (`data-enter`) and 1-2 interactive dealt moments.
   - Prohibited: autoplaying carousels, 3D card tilts, jarring scroll-jacking.
6. **Real Photography Over Generic Stock**:
   - Use authentic licensed photographs from open archives (via `photos.mjs` or client assets).
   - Rich backgrounds and intentional typography pairings.
7. **Authentic Full-Color Brand & Product Icons**:
   - Use official SVG vector icons for tools and brands (via `icons.mjs`), never hand-drawn or generic approximations.
   - Include crisp architecture/diagram cards (data hubs, processing lanes, pulse animations).
8. **Shader Effects Only on Tech/Gaming/DevTools**:
   - WebGL, canvas shaders, and 3D scenes are strictly reserved for software, developer tools, AI, gaming, and tech hardware.
   - Local businesses, hospitality, and artisan shops use high-quality photography and clean type instead.
9. **Realistic Addresses & Privacy Discipline**:
   - Use city/district names only; never use real residential addresses, real tax IDs, or valid private phone numbers.
   - Use `.example` domains for contact email addresses.

## Verification & Finish Gate Workflow

Before completing any frontend or landing page task:
1. Run consistency linter:
   ```bash
   node <skill>/scripts/consistency.mjs <page.html>
   ```
2. Verify in real headless browser via finish gate:
   ```bash
   node <skill>/scripts/gate.mjs <page.html|url>
   ```
3. Capture multi-breakpoint screenshots:
   ```bash
   node <skill>/scripts/shoot.mjs <page.html|url>
   ```
4. Address all reported errors before marking work complete.

