# Unslop & Anti-Slop Interface Craft Rules

These rules govern all UI, frontend, and design tasks across Antigravity IDE projects to ensure interfaces are bespoke, crafted, and free from AI vibecoded clichés.

## Core Anti-Slop Principles

### 1. Zero Tolerance for AI Slop Tells
- **No Purple/Violet Defaultism**: Never default to purple, violet, indigo-pink gradients or neon glow effects on backgrounds, buttons, or cards.
- **No Glowing Shadows**: Eliminate `shadow-[0_0_25px_rgba(...)]`, colored drop shadows, and radial neon washes behind text.
- **No Emojis in Interface Elements**: Never use emojis (🚀, 💡, 💰, ✨, 🔥, 🤖, etc.) as navigation icons, status tags, or list bullets. Use clean SVG vector icons (Lucide, Radix, Heroicons).
- **No Gradient Text**: Prohibit `bg-clip-text text-transparent bg-gradient-to-r`. Headlines, numbers, and logos must use solid, deliberate primary text colors.
- **No Hype Copy**: Never write "supercharge", "unleash", "revolutionary", "all-in-one AI magic", or end statements with exclamation marks (`!`).
- **No "New ✨" Sparkle Badges**: Interface elements must describe what they do with plain, professional terminology.

### 2. Quiet Chrome, One Bright Element
- Chrome (sidebars, navbars, utility bars, page backgrounds) must stay quiet and tinted neutrally.
- Use a single neutral ramp (slate, zinc, stone, or neutral) with 3 clear text roles (primary, secondary, muted).
- Exactly ONE element on the screen should carry rich color or focal craft (the hero visual, the primary data chart, or the main canvas).

### 3. Spacing & Geometric Rigor
- All spacing (padding, margin, gap) MUST snap to the **4px scale**:
  `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`.
- Sibling cards and list items must have identical dimensions and padding.
- Nested radii must obey geometry: `inner_radius = outer_radius - padding`.

### 4. Typographic Restraint
- Restrict font weights to 400 (regular) and 500 (medium). Use 600 (semibold) only for high-contrast section headers. Avoid weights 800-900.
- Never use uppercase tracked labels (`NAVIGATION`, `PAYMENT DETAILS`); use sentence case.
- All numbers, dates, currency, and table data MUST use tabular figures (`tabular-nums`).

### 5. Systematic 8-Pass Refactoring
When unslopping or polishing existing screens, execute passes in strict order:
1. Spacing (4px scale alignment)
2. Color (quiet neutral ramp + 1 accent)
3. Icons (vector icons only, uniform stroke)
4. Copy (grounded, domain-authentic, no exclamation marks)
5. Type (restrained weights, tabular figures)
6. Layout (clear visual hierarchy, no dead space)
7. Details (proper nested radii, subtle 1px hairlines)
8. Visuals & Motion (product-authentic previews, quiet 150ms transitions)

