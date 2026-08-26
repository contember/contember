# docs

The public documentation at https://docs.contember.com/ — an in-repo static site built with **pletivo** (previously Docusaurus, then Astro Starlight; older notes and file headers still mention those).

- Pages are `.mdx` under `src/content/docs/`, organized as `intro/`, `guides/`, `reference/`, `cloud/`.
- The tenant API is documented page-per-topic under `reference/engine/tenant/`; the admin-UI and data-binding side under `reference/interface/`.
- `src/lib/nav.ts` is the navigation tree — leaf `id`s are collection entry ids (the path under `src/content/docs/` without `.mdx`). Folding new operations into an existing page needs no nav change; a **new page** must be added there or it is unreachable.

```bash
bun run --cwd docs dev        # pletivo dev on :3010
bun run --cwd docs build      # compiles the site — the only way to catch broken mdx
bun run --cwd docs typecheck
```

## Conventions

- **Version-gate new features** with an admonition — `:::note[Available since X.Y]` then `:::`. The `[...]` label is parsed as inline markdown, so backticks work (`reference/engine/schema/columns.mdx` uses them). The current unreleased version is **2.2** (root `package.json`, `2.2.0-alpha.x`), which is what the whole tenant reference is stamped with — match it for new tenant features unless told otherwise.
- Admonition kinds are `note`, `tip`, `info`, `warning`, `caution`, `danger` (`src/lib/remark-admonitions.ts`). The Docusaurus `:::note Some Title` form (trailing title text) is **not** valid remark-directive syntax — use the bracket form.
- Canonical shape for a listing/query page: a GraphQL example, a field table, and one line on per-caller visibility (whether a caller without permission gets an empty list or an error). `reference/engine/tenant/sessions.mdx` is the template.
- Document a **PostgreSQL extension prerequisite** here rather than installing it from a migration — see `packages/schema-migrations/CLAUDE.md`. The trigram operators in `reference/engine/content/queries.mdx` and `reference/engine/schema/columns.mdx` are the pattern.

## CI

**PR CI ignores `docs/**`** (`paths-ignore` in `.github/workflows/build.yaml`), so a docs-only change runs no checks in this repo — build the site locally before pushing. dprint has no markdown plugin either, so `format:check` never looks at `.md`/`.mdx`.

Per-package `CLAUDE.md` files are agent-facing notes and a separate thing from this site; do not move content between them without deciding which audience it is for.
