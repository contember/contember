# Local reproduction of `test-db-replica`

`e2e/replica` needs what `test-db` cannot give it: a **real streaming standby** that can be held
back on purpose. `docker-compose.yaml` here starts the same pair the CI job uses — a bitnami
primary (`db`) and its hot standby (`db_replica`) — and nothing else. The engine runs on the host,
exactly as it does on the runner.

## 1. Start the pair

```bash
docker compose -f scripts/ci/replica/docker-compose.yaml up -d --wait
```

Ports 5432 (primary) and 5433 (standby) are published. If either is taken, override them —
the rest of the commands then use your ports:

```bash
PRIMARY_PORT=55442 STANDBY_PORT=55443 docker compose -f scripts/ci/replica/docker-compose.yaml up -d --wait
```

Check that replication is really streaming:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5432 -U postgres -tAc "select state from pg_stat_replication"
```

## 2. Start an engine against it

The standby is a physical copy of the primary, so the tenant and project databases the engine
creates are replicated as they are written.

```bash
NODE_ENV=development \
CONTEMBER_PORT=4000 CONTEMBER_MONITORING_PORT=4001 \
CONTEMBER_ROOT_TOKEN=0000000000000000000000000000000000000000 \
CONTEMBER_LOGIN_TOKEN=1111111111111111111111111111111111111111 \
CONTEMBER_APPLICATION_WORKER=all \
DEFAULT_DB_HOST=127.0.0.1 DEFAULT_DB_PORT=5432 \
DEFAULT_DB_USER=postgres DEFAULT_DB_PASSWORD=postgres \
DEFAULT_DB_READ_HOST=127.0.0.1 DEFAULT_DB_READ_PORT=5433 \
TENANT_DB_NAME=test_tenant \
TENANT_MAILER_HOST=localhost TENANT_MAILER_PORT=1025 TENANT_MAILER_FROM=contember@localhost \
CONTEMBER_PACKAGE_JSON="$PWD/packages/engine-server/package.json" \
bun --conditions=typescript ./packages/engine-server/src/start.ts
```

Read-after-write is enabled only because `DEFAULT_DB_READ_HOST` is set. Without it the tests fail
with `Missing X-Contember-Write-Ref`.

## 3. Run the tests

Mailhog is not part of this compose file — the shared one provides it, and it does **not**
publish the canonical port (`docker-compose.override.dist.yaml` maps it to
`${CONTEMBER_MAILHOG_PORT:-3006}`), so resolve the host port instead of assuming one:

```bash
docker compose up mailhog --detach
```

```bash
CONTEMBER_API_URL="http://localhost:4000" \
CONTEMBER_ROOT_TOKEN="0000000000000000000000000000000000000000" \
CONTEMBER_LOGIN_TOKEN="1111111111111111111111111111111111111111" \
MAILHOG_URL="http://localhost:$(docker compose port mailhog 8025 | cut -d: -f2)" \
E2E_REPLICA_DSN="postgres://postgres:postgres@127.0.0.1:5433/postgres" \
NODE_ENV=development \
bun test --conditions=typescript e2e/replica
```

`E2E_REPLICA_DSN` must be a **superuser** connection to the standby: the tests call
`pg_wal_replay_pause()` / `pg_wal_replay_resume()` on it. A test that dies between the two leaves
the standby paused; every later run then reads stale data. Recover with:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 5433 -U postgres -c "select pg_wal_replay_resume()"
```

## 4. Tear down

```bash
docker compose -f scripts/ci/replica/docker-compose.yaml down -v
```

## Follow-up

`bitnamilegacy/postgresql` is a frozen archive: it receives no updates and could disappear. The
robust long-term form is `postgres:16` with a standby built by `pg_basebackup -R` in a compose
step, which would also let the workflow services and this file stop describing the same topology
twice.
