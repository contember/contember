# create

`npm create @contember/…` scaffolder. The project template lives in `resources/templates/default/` — `admin/`, `api/`, `client/`, `docker/` and the compose/config files a new project starts from.

## `admin/lib` is generated, not source

`resources/templates/default/admin/lib/` is **gitignored** (root `.gitignore`) and assembled at pre-build by `resources/templates/default/scripts/assemble-ui-lib.mjs`:

```bash
bun run --cwd packages/create pre-build     # refresh it after changing a UI package
```

The script merges `react-ui-lib-base` (flat) + `react-ui-lib-tenant` (into `tenant/`) + `react-ui-lib` (flat), rebuilds the colliding `index.ts` / `form/index.ts` barrels, and rewrites `@contember/react-ui-lib-base` → `~/lib` and `@contember/react-ui-lib-tenant` → `~/lib/tenant`. A generated project owns that tree outright, which is the point — the user customises it freely.

**Why this trips people up:** the output looks byte-identical to the package sources except for the imports, so it reads like a hand-maintained copy that has drifted. It has not — a diff against the packages only tells you which branch was last built. Never mirror files into it by hand and never commit it.

Two consequences:

- **The template is not typechecked by CI** (it has no `node_modules`). To verify template code, temporarily add `customConditions: ["typescript"]` to `admin/tsconfig.json` (it already maps `~/*`) — node resolution then finds the repo-root `node_modules` and the workspace packages' sources. Expect unavoidable errors for `import.meta.env` / `glob`, `index.css` and `@sentry/react`.
- Because base's dictionary lands at `~/lib/dict` and tenant's at `~/lib/tenant/dict`, template code reading `dict.tenant.*` must import the latter.

Only `admin/app/`, `admin/entrypoint/` and the other tracked template directories are real source.
