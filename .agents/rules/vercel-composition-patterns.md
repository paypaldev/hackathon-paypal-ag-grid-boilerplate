# Vercel React Composition Patterns

When constructing React components and design systems:

1. **Avoid Boolean Flag Explosions**:
   - Instead of piling on booleans (`isCompact`, `withBadge`, `hasAvatar`, `isSecondary`), break the component into composable parts or subcomponents.
2. **Compound Components**:
   - Provide subcomponents that share implicit state (`Card.Header`, `Card.Content`, `Card.Footer`).
3. **Children and Slots Over Config**:
   - Accept `children` or explicit JSX slot props (`icon={<Icon />} `) instead of string IDs or data configurations.
4. **React 19 Cleanups**:
   - Do not wrap components in `forwardRef`; access `ref` directly as a regular prop.
   - Use the `use()` hook for reading promises and contexts cleanly.
