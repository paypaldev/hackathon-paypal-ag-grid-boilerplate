# Web Design Guidelines (Vercel)

When designing, auditing, or implementing frontend web interfaces, follow Vercel's Web Interface Guidelines:

## 1. Accessibility (WCAG 2.2 AA)
- Provide clear `aria-label` or visually hidden text for icon-only buttons.
- Use semantic HTML tags (`<main>`, `<nav>`, `<aside>`, `<header>`, `<button>`).
- Maintain interactive color contrast ratios (minimum 4.5:1 for body text, 3:1 for large text and UI components).
- Ensure all interactive elements are reachable and operable via keyboard.

## 2. Focus States & Form UX
- Never remove `:focus` or `:focus-visible` outlines without providing an accessible custom ring.
- Add proper `autocomplete` attributes to input fields (e.g., `username`, `current-password`, `email`).
- Keep validation error messages explicitly tied to inputs via `aria-describedby` and `aria-invalid`.

## 3. Motion & Animation
- Always support `@media (prefers-reduced-motion: reduce)` by disabling or simplifying movement.
- Animate only composite properties (`transform`, `opacity`) to guarantee 60fps/120fps smooth performance without triggering layout reflows.

## 4. Typography & Numbers
- Use proper typographic symbols: curly quotes (`“` `”`), apostrophes (`’`), and ellipses (`…`).
- Apply `font-variant-numeric: tabular-nums` or monospace fonts for timers, counters, statistics, and table columns.

## 5. Responsive & Touch Behavior
- Set `touch-action: manipulation` to remove the 300ms mobile tap delay.
- Use CSS safe area insets (`env(safe-area-inset-bottom)`) for fixed elements.
