# Design Motion Principles & Anti-Slop Motion Standards

## Purpose

Ensures all user interface motion in Antigravity IDE projects is purposeful, performant, accessible, and free of generic AI-generated motion anti-patterns.

---

## When to Apply

Apply these rules whenever:
- Creating, styling, or animating interactive UI components (buttons, dialogs, drawers, dropdowns, toasts, tabs, accordions, page transitions).
- Reviewing or auditing animation code in CSS, Tailwind, React, Framer Motion / Motion.
- Adding micro-interactions, hover states, press states, or loading indicators.

---

## 1. The Three Designer Lenses

Calibrate animation decisions based on project context:
- **Productivity & SaaS (Emil Kowalski)**: Prioritize restraint and speed. Timings < 300ms (180ms ideal). No animations on frequent or keyboard-triggered actions.
- **Consumer & Professional Web (Jakub Krehel)**: Subtle production polish. Smooth, critically damped springs (200–400ms). Exit transitions faster and quieter than enters.
- **Creative, Playful & Landing Pages (Jhey Tompkins)**: Expressive delight, inventive CSS (@property, clip-path, scroll-driven motion), character-rich interactions.

---

## 2. The Frequency Gate (Emil's Rule)

Before adding any animation, check trigger frequency:
- **100+ times / day (Frequent)**: Zero animation or instant (< 120ms). Never slow the user down.
- **Daily (Occasional)**: 150–250ms subtle transform/opacity.
- **Rare / First-Time**: Expressive motion is welcomed.
- **Keyboard Initiated**: ALWAYS instant (0ms). Never delay a keyboard shortcut.

---

## 3. Anti-AI-Slop Motion Quality Gate

Flag and eliminate the recognizable fingerprints of AI-generated motion:
1. **No Pulsing Indicators**: Do not add infinite pulsing/glowing badges to static UI elements.
2. **No Hover-Scale-On-Everything**: Avoid applying `hover:scale-105` to every card and button. Use subtle background tint or border shifts instead.
3. **No Blanket Stagger-Spam**: Do not stagger 20 items in a list on mount with `delay: i * 0.1`. If staggering, cap total duration at 250ms or stagger only the first 3–4 items.
4. **No Bouncy Springs on Utility Controls**: Save bouncy springs for celebratory or playful contexts. Utility buttons, selects, and dialogs must use high stiffness with no overshoot.
5. **No Starting from `scale(0)`**: Enter animations should start from `scale(0.92)` or `scale(0.95)`, never `scale(0)`.
6. **No Default `ease`**: Never use the browser default `transition: all 0.3s ease`. Use intentional bezier curves (e.g. `cubic-bezier(0.16, 1, 0.3, 1)`) or springs.

---

## 4. Hardware Performance & Reflow Prevention

- **GPU Acceleration**: ONLY animate `transform` (`translate`, `scale`, `rotate`), `opacity`, and `filter`.
- **FORBIDDEN Layout Triggers**: NEVER animate `height`, `width`, `top`, `left`, `bottom`, `right`, `margin`, or `padding`. Use transform scale, clip-path, or FLIP technique instead.
- **will-change Discipline**: Apply `will-change: transform, opacity` sparingly and only during active animation or hover. Remove on idle.

---

## 5. Non-Negotiable Accessibility

Every animation must respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
In Framer Motion:
```tsx
import { useReducedMotion } from "framer-motion";
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 };
```

---

## 6. Motion Gap Detection

During code reviews, look for conditional UI swaps that happen without transitions:
- Conditional renders `{isOpen && <Modal />}` missing `<AnimatePresence>`.
- Tab content swaps that flicker instantly.
- Toast notifications that unmount abruptly.
