# engine-panel

Serves the management panel (`packages/panel-ui`) **from inside the engine**, so a self-hosted deployment gets one without a separate admin app. Off by default: `CONTEMBER_PANEL_ENABLED`, mount path via `CONTEMBER_PANEL_PATH` (absolute, e.g. `/panel`).

- `PanelPlugin` — wires everything into the HTTP application.
- `PanelController` / `PanelAssets` — serve the shell and the embedded static assets.
- `PanelApiController`, `PanelMount`, `PanelAccessCheck` — the panel-scoped API mount and its gate.

## Constraints that shaped it

- **The runtime docker image contains only `dist/start.js`** (`scripts/docker/server-*.dockerfile`), so the UI cannot be a directory of files. Assets are gzipped, base64'd into `src/generated/assets.ts` and bundled. The panel asset build is deliberately **not** a `pre-build` hook (the root `pre-build` fans out to every package, which would tie the CLI image to panel-ui), so `scripts/server-build/run.sh` — which the server dockerfiles run — calls `build:assets` explicitly after `pre-build`.
- `src/generated/assets.ts` is a **tracked 379-byte stub** rewritten by `bun run panel:assets`, kept out of `git status` by `scripts/setup.sh` (assume-unchanged). See the repo-root CLAUDE.md — committing the regenerated form bakes the whole UI into git history.
- The payload rides in the binary for every deployment, panel or not. The placeholder measured **+86 kB on a 6.5 MB bundle**; a full admin app (~483 kB gzipped) is the practical ceiling, so modules must stay lazy chunks.
- **Static assets go through `addInternalRoute`, not `addRoute`** (`PanelPlugin.ts`). A regular route authenticates before dispatch — that would mean a project-group resolve and an API-key DB verification *per file request*.
- **Relative Vite `base` plus an injected absolute `<base href>`** is what makes the mount path configurable at runtime (`__CONTEMBER_PANEL_BASE__` / `__CONTEMBER_PANEL_CONFIG__` placeholders). Vite then resolves lazy chunks via `import.meta.url`, so route depth cannot break asset URLs.
- **Project scope is just `ProjectSlugContext` + `StageSlugContext`** swapped under a route. Every client hook builds `${apiBaseUrl}${path}`, so mounting the whole API under `<base>/api` makes tenant, content, system and actions work with no client change. Stage appears in the URL on content routes only.
- **Plugins reach the panel through `PanelApiMount`**, a service declared in `engine-http` with a no-op default (`DisabledPanelApiMount`) and replaced by `PanelMount` here. `engine-actions` consumes it — the dependency runs plugin → panel, never back. The shell renders on the first request rather than at construction, so a plugin mount registering after the panel's hook still reaches the UI via `pluginApis`.

## Gotchas worth keeping

- **A denied read from a panel-mounted API arrives as HTTP 400, never 403.** `ForbiddenError extends GraphQLError`, and `processErrors` grades a `GraphQLError` 400 before it reaches the 403 branch. 403 belongs to the panel gate alone, which is what `isPanelAccessDenied` relies on.
- **`__typename` is not selectable through the generated graphql-ts-client fetchers** — `event$.__typename` is `undefined` at runtime although the `.d.ts` declares it. Discriminate a union by a field only one member carries.
- **`EventsArgs.stage` (system API) does not filter events.** It only picks whose ACL the read is checked against; `EventsQuery` joins `stage_transaction` without constraining on it.
- **A project `deployer` cannot enter the panel at all** under the default policy (`projectRoles: ['admin']`), so the deployer branch of a module's `isAvailable` is not exercisable without changing `panel.projectRoles`.
- Query layers are **generated typed clients** (`graphql-client-actions` mirrors `graphql-client-system`), not hand-written query strings and not full `react-client-*` hook packages.

Access control model: the env flag decides availability, the **tenant** `Config.panel { globalRoles, projectRoles }` (stored tenant configuration, resolved by `PanelAccessResolver`) decides who may enter, and the tenant ACL is the actual boundary. Panel login is password + OTP only — IdP redirect URLs and `ConfigPasswordless.url` point at the public-facing app.

Local seeding for panel work: `bun --conditions=typescript scripts/dev/seed-local.ts` (see `e2e/CLAUDE.md` if the engine refuses to boot on migration drift).
