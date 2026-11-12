# Vercel Deployment & Cost Optimization

When deploying or tuning projects hosted on Vercel:

1. **Observability First**:
   - Collect metrics and runtime telemetry before rewriting code. Identify top slow routes, function invocations, and cache miss rates.
2. **Compute Optimization**:
   - Use Edge middleware only for routing, redirects, and auth gates.
   - Choose Node.js runtime for intensive DB or computational operations.
   - Set optimal serverless function memory and region near your database to minimize cold starts.
3. **Caching & ISR Strategy**:
   - Configure Incremental Static Regeneration (`revalidate`) for read-heavy public pages.
   - Cache expensive database queries with `unstable_cache` or `React.cache()`.
   - Ensure headers do not inadvertently set `Cache-Control: private, no-cache` on static assets.
4. **Bandwidth & Assets**:
   - Serve modern image formats (AVIF/WebP) via Next.js Image Optimization.
   - Enforce content hashes on static bundle chunks for immutable client caching (`max-age=31536000, immutable`).
