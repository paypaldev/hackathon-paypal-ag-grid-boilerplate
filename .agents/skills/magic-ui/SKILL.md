---
name: magic-ui
description: Find, install, and generate modern React, Tailwind, and shadcn/ui components, themes, and brand logos with 21st.dev / Magic MCP. Use when the user asks for frontend UI, landing page blocks, pricing tables, hero sections, navbars, dashboards, or brand SVG logos.
---

# Magic UI / 21st.dev Skill

Discover, install, and generate modern UI components from 21st.dev (Magic MCP). Contains over 10,000+ battle-tested React + Tailwind CSS components (compatible with shadcn/ui, Radix UI, Framer Motion, and Lucide icons), plus hosted AI generation and brand logos.

## When to Use

- Building or enhancing user interfaces: navbars, hero sections, pricing tables, feature grids, testimonials, dialogs, drawers, sidebars, charts, and dashboards.
- Looking for UI inspiration or design patterns before implementing.
- Needing clean SVG brand logos in React/JSX format (`search_logo` / `21st logo`).
- Generating custom components from natural language specifications (`generate`).

## Available Tools & CLI Commands

### 1. Catalog Search & Component Retrieval
- **MCP Tool `search`**: Query catalog for components, themes, and templates.
  - Arguments: `query` (e.g. `"pricing table"`, `"animated hero"`, `"dark dashboard"`), `type` (`"component"` | `"theme"` | `"template"`).
  - CLI alternative: `21st search "<query>" --json`
- **MCP Tool `get_component`**: Get complete source code, imports, dependencies, and demo code for a component ID.
  - Arguments: `id` (numeric ID or slug from search).
  - CLI alternative: `21st get <id> --json`
  - Direct install via CLI: `21st add <author>/<slug>`

### 2. Brand & Technology Logos (SVGL)
- **MCP Tool `search_logo`**: Search and retrieve official SVG components formatted for JSX/TSX.
  - Arguments: `query` (e.g. `"React"`, `"OpenAI"`, `"Google"`, `"Stripe"`, `"GitHub"`), `limit`.
  - CLI alternative: `21st logo "<brand>" --json` (Free, instant, no login required).

### 3. Design Inspiration & Themes
- **MCP Tool `get_inspiration`**: Get design inspiration and ideas for layouts and interactive patterns.
- **MCP Tool `get_theme`**: Fetch CSS variables and tokens (`:root` and `.dark`) for 21st themes.
  - CLI alternative: `21st theme <id> --json`

### 4. Hosted AI UI Generation
- **MCP Tool `get_usage`**: Inspect AI generation entitlement (`aiGenerationEnabled`) and daily free quotas.
- **MCP Tool `generate`**: Generate fresh UI component variants based on a prompt.
  - Arguments: `prompt`, `variants`, `context`.
  - CLI alternative: `21st generate "<prompt>" --json`
- **MCP Tool `iterate_generation`**: Refine an existing generation with incremental changes.
  - Arguments: `projectId`, `change`, `take`.

## Standard Integration Workflow

1. **Search**: Search for existing high-quality implementations rather than building from scratch:
   `call_mcp_tool(ServerName: "magic", ToolName: "search", Arguments: { "query": "animated bento grid" })`
2. **Review & Select**: Pick the best component matching the project's styling and dependencies.
3. **Fetch Code**: Fetch full code via `get_component`:
   `call_mcp_tool(ServerName: "magic", ToolName: "get_component", Arguments: { "id": "<component_id>" })`
4. **Integrate**: Write the component file into the project's components directory (e.g., `src/components/ui/` or `components/`), ensure dependencies like `framer-motion` or `lucide-react` are installed, and adapt Tailwind classes to the project's theme.
5. **Brand Logos**: If the component needs brand badges/logos, call `search_logo` to obtain clean vector SVGs.

## Authentication & API Keys

- Basic catalog search and brand logo retrieval are free.
- Free tier allows 2 component source unlocks per day.
- A free API key can be obtained instantly at https://21st.dev/mcp.
- Configure via `API_KEY_21ST` or `TWENTY_FIRST_API_KEY` environment variable.
