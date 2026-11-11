# Vercel React Best Practices

When writing, reviewing, or refactoring React and Next.js applications, strictly adhere to Vercel Engineering's 70 performance guidelines categorized by priority:

## 1. Eliminating Waterfalls (CRITICAL)
- **Check cheap conditions first**: Evaluate cheap synchronous boolean conditions or local checks before awaiting feature flags or remote queries.
- **Defer `await`**: Do not await promises at the top of a function if they are only needed inside conditional branches.
- **Parallelize independent promises**: ALWAYS use `Promise.all()` or `Promise.allSettled()` for independent async calls.
- **Dependency-based parallelization**: For partial async dependencies, kick off promises immediately and await only at the exact point of dependency consumption.
- **API route parallelization**: In route handlers, fire all independent DB/API promises before awaiting the first one.
- **Suspense boundaries**: Wrap slow async server components in `<Suspense fallback={<Skeleton />}>` to enable immediate streaming of shell UI.

## 2. Bundle Size Optimization (CRITICAL)
- **Avoid barrel files**: Avoid importing from index/barrel files (e.g. `import { Button } from '@/components'`). Import directly from leaf modules (`import { Button } from '@/components/button'`).
- **Dynamic imports**: Wrap heavy client-only libraries (charts, rich-text editors, 3D viewers) in `next/dynamic` or `React.lazy()` with `ssr: false`.
- **Defer non-critical third parties**: Load analytics, logging, and chat widgets only after hydration using `next/script` with `strategy="afterInteractive"` or `lazyOnload`.
- **Preload on user intent**: Prefetch bundles and routes upon mouse hover or focus.

## 3. Server-Side Performance (HIGH)
- **Authenticate Server Actions**: Treat Server Actions like public REST endpoints—validate user session and permissions on every action.
- **Use `React.cache()`**: Deduplicate identical per-request data fetches across different server components in the same render tree.
- **Minimize RSC serialization**: Pass only necessary scalar properties across Server-to-Client component boundaries.
- **Use Next.js `after()`**: Offload non-blocking tasks (logging, metrics, analytics) to `after()`.

## 4. Client-Side Data Fetching (MEDIUM-HIGH)
- Use SWR or TanStack Query for automatic deduplication, caching, and background revalidation.
- Deduplicate window/document event listeners and use passive listeners for scroll/touch events.

## 5. Re-render Optimization (MEDIUM)
- Calculate derived state during render rather than syncing in `useEffect`.
- Defer reading state until the leaf component that needs it.
- Never define components inside other component render functions.
- Keep `useMemo` and `useCallback` dependency arrays narrow.
