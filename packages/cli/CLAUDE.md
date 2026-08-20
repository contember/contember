# cli

Contember project and tenant CLI. Treat `docs/src/content/docs/reference/cli.mdx` and runtime help as the user-facing reference; do not duplicate the command catalog here.

## Commands

```bash
bun run pre-build
bun test --conditions=typescript packages/cli/tests
bun test --conditions=typescript packages/cli/tests/cases/unit/<file>.test.ts
```

Run `pre-build` before process tests; generated GraphQL client barrels are required. CI runs it before the test suite.

## Critical invariants

- Use canonical space-separated noun→verb names. Register the same factory under a silent colon alias in `dic.ts`.
- Reserve global option names and shortcuts: `--json`, `--quiet`/`-q`, `--no-color`, `--help`/`-h`.
- Write only through the shared `Output`. Stdout is result data; stderr is diagnostics. Never use `console.*`.
- Use `output.data(value, { human, quiet })` for typed projections. JSON emits the raw value; quiet emits scalars.
- Suppress informational diagnostics, progress and subprocess noise in JSON and quiet modes. JSON errors are one stderr document.
- Diagnostics do not reach JSON or quiet callers. Anything the caller must act on belongs in the `output.data` payload, not only in `output.warn`.
- Read the output mode from raw argv before workspace/container bootstrap so bootstrap failures use the requested format.
- Throw `CliError` with a stable code and correct `ExitCode`. Let `Application` render command failures.
- Never prompt in JSON, quiet or non-TTY runs. Require `--yes` or throw `TTY_UNAVAILABLE`.
- Never read stdin implicitly. Reach `lib/tenant/stdin.ts` only behind an explicit `--*-stdin` option.
- Pass the shared `Output` to `CommandRunner`. Give it only human-safe display text; never raw argv or secrets.

## Architecture

- Entry: `run.ts` → `dic.ts` → `Application` → `CommandManager`.
- Commands extend `Command<Args, Options>` and receive `Output` as the second `execute` argument.
- Tenant commands use `TenantClientProvider` and domain clients over `TenantApiTransport`.
- Read `lib/tenant/clients/README.md` before adding a tenant client method.
- Reuse `lib/tenant/input/` for explicit input sources and GraphQL pagination bounds.
- `tenant apply` loads `tenant.config.ts` and applies additions/updates without pruning.
- Tenant commands except `tenant apply` use `CONTEMBER_*`; their `--project` selects a tenant project, not the connection.
- Migration snapshots live at `{migrationsDir}/snapshot.json`; commit them and verify with `migrations verify-snapshot`.

## Adding a command

1. Add the class under `commands/<group>/` and export it from the group barrel.
2. Register its service and canonical/colon names in `dic.ts`.
3. Add focused command tests with human, JSON, quiet and failure cases as applicable.
4. Keep `command-registry.test.ts` green; it checks construction, aliases, prefixes, tenant exports and the catalog.
5. Update user documentation only when the public contract changes.
