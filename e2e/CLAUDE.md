# e2e

Integration tests that run against a **live engine and PostgreSQL**, not against mocks. There are two suites and two CI jobs:

| Directory | CI job | Database |
| --- | --- | --- |
| `e2e/cases` | `test-db (14..18)` — one job per PostgreSQL major | one server, which the engine also uses as its own read replica |
| `e2e/replica` | `test-db-replica` | a primary and a **real streaming standby** |

`bun run test:e2e` globs **`e2e/cases` only**. `e2e/replica` needs a standby it can hold back, so it is run explicitly (`bun test --conditions=typescript e2e/replica`) and never by `test:e2e`. Both jobs build the server and start it via `start-server.sh`, both are fail-fast, and like the rest of the workflow they run on `pull_request`, pushes to `main` and tags — never on a plain branch push.

`test-db` is therefore the only place where authorization grants, resolvers and SQL meet for real — a feature covered solely by unit and mocked tests is not covered here.

## Read replica routing is on in `test-db`

`test-db` sets `DEFAULT_DB_READ_HOST` to the primary itself: same `system_identifier`, same version, so read-after-write routing is enabled and **every content case goes through it**. Queries are served from the "replica" and mutations return `X-Contember-Write-Ref`, which is what lets `cases/content/read-after-write.test.ts` assert the header contract without a standby. It also means a routing regression shows up as an unrelated content case failing.

The second pool this creates is not free: the peak backend count over the suite went from ~69 to ~97 of PostgreSQL's default `max_connections=100`, so the job releases idle read connections after 2 s (`DEFAULT_DB_READ_POOL_IDLE_TIMEOUT_MS`). Anything that adds pools or long-held connections has very little headroom left.

What `test-db` **cannot** show is a replica that lags — the primary never does. That is what `e2e/replica` is for: it pauses WAL replay on the standby and observes the fallback to the primary and the acknowledgement after catch-up. Run it locally with `scripts/ci/replica/` — see [its README](../scripts/ci/replica/README.md).

## Running locally

Bring up the engine (it pulls in postgres; **mailhog is not a dependency** — start it explicitly or the tester fails on `/api/v1/messages`):

```bash
docker compose up engine mailhog --detach
```

Resolve the host ports — compose does not necessarily bind the canonical ones:

```bash
docker compose port engine 4000     # e.g. 0.0.0.0:3001
docker compose port mailhog 8025    # e.g. 0.0.0.0:3006
```

Then run a scoped subset:

```bash
CONTEMBER_API_URL="http://localhost:3001" \
CONTEMBER_ROOT_TOKEN="0000000000000000000000000000000000000000" \
CONTEMBER_LOGIN_TOKEN="1111111111111111111111111111111111111111" \
MAILHOG_URL="http://localhost:3006" \
NODE_ENV=development \
bun test --conditions=typescript --no-file-parallelism e2e/cases/tenant/policy.test.ts
```

- `--conditions=typescript` is required — without it `@contember/*` resolves to a stale `dist`.
- **`NODE_ENV=development` matters on the *test* process.** Some cases branch on it to pick the expected message (`tenant-member-access.test.ts` expects "You are not allowed to access project X" in dev, "Project X NOT found" otherwise). The compose engine runs in development, CI runs the server in production; a mismatch looks like a regression.
- The engine runs `bun --watch` over mounted source, so editing or formatting files mid-run restarts it.
- **A full local `bun run test:e2e` is not realistic on a developer machine.** 64 files run in parallel against one PostgreSQL at its default `max_connections=100`; the engine starts answering `sorry, too many clients already` and dozens of cases fail with `ECONNREFUSED`. Run subsets with `--no-file-parallelism` and leave the full suite to CI.
- Always capture a **baseline without your new file** before judging failures — a fresh empty tenant DB alone makes a handful of unrelated cases fail (authLog, mfaEnforcement, sessionPolicy, migrations-snapshot).
- Never pipe a `bun test` run through `head`: SIGPIPE kills it mid-test, its `finally` cleanup never runs, and the leftover scratch dirs and DB rows look like a bug in your test. Redirect to a file.

## When the engine will not boot: migration drift

A persistent local tenant DB records whichever migrations the last branch carried. On a branch that lacks one of them, `checkOrder` aborts the boot with **`Previously executed migration is missing`**. This is drift, not corruption — it recovers on the original branch.

Check what is actually recorded before assuming which migration it is:

```bash
docker compose exec -T postgres psql -U contember -d tenant -c "select name from tenant.migrations order by name desc limit 10;"
ls packages/engine-tenant-api/src/migrations/*.ts | xargs -n1 basename | sed 's/\.ts$//' | grep '^20' | sort | tail -10
```

Do **not** delete or rename the bookkeeping row — real data sits behind it, and renaming just moves the failure (the repo has migrations sorting before the new timestamp).

The clean workaround is a throwaway engine over an empty tenant DB on its own port, so nothing persistent is touched:

```bash
docker compose exec -T postgres psql -U contember -d postgres -c "CREATE DATABASE e2e_tenant;"
docker compose run -d -e TENANT_DB_NAME=e2e_tenant -p 3110:4000 --name e2e-engine engine   # no --rm: keep the logs if it dies
# … run tests against http://localhost:3110 …
docker rm -f e2e-engine
docker compose exec -T postgres psql -U contember -d postgres -c "DROP DATABASE IF EXISTS e2e_tenant;"
```

Stop the compose `engine` first if it is crash-looping — both hold connections. Wiping the volume (`docker compose down -v`) also works, but destroys local data.

## Writing tests

**The `gql` tag in `src/tester.ts` is not a GraphQL parser.** It is `assert.strictEqual(strings.length, 1); return strings[0]`, and exists only so formatters recognize the query. An interpolation makes `strings.length === 2` and throws `AssertionError: 2 !== 1` *before the request is sent* — the stack points at `gql (tester.ts:22)`, which reads like a row-count mismatch.

For dynamic values use GraphQL variables via the tester's `{ variables }` option (see `executeMigrations`), or a static literal when the value is irrelevant (asserting that an entity exposes no update mutation 400s on the unknown field regardless of the id).

Cover DB-serialization concerns here rather than in unit tests — a mapper unit test cannot see how a value lands in PostgreSQL.

## Known flake

`cases/tenant/disablePerson.test.ts` → `disablePerson blocks future signIn with PERSON_DISABLED` fails intermittently on a **single** `test-db` shard while the others pass on identical code. The assertion prints only `body.data`, so the underlying GraphQL error is invisible. Re-run before investigating (`gh run rerun <runId> --failed`). If it ever fails on several shards at once that is real — dump `body.errors` at the assertion; the test signs in during setup, so a sign-in rate limit is the first suspect.
