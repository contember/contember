---
title: Test transactions
---

Test transactions let a test suite wrap a sequence of HTTP requests in a single database
transaction that is rolled back when the test finishes. Each test then starts from the same
already-seeded, committed baseline — without truncating and reseeding the database between tests.

Inside such a transaction, writes from one request are visible to later requests in the same
session, but nothing is ever committed: when the test ends, the whole transaction is rolled back
and the baseline is restored.

:::danger
This feature pins and holds database connections and exposes uncommitted data, so it is a denial-of-service
and data-visibility vector. It is **off by default** and the engine **refuses to start** with it
enabled under `NODE_ENV=production`. Only enable it in test/CI environments.
:::

## Enabling

Test transactions are opt-in via server configuration. When disabled (the default) the routes below
are not registered and the session header is ignored.

| Config | Environment variable | Default | Meaning |
| --- | --- | --- | --- |
| `test.transactions` | `CONTEMBER_TEST_TRANSACTIONS` | `false` | Enables the feature and registers the `/test/transaction` routes. |
| `test.transactionTtlSeconds` | `CONTEMBER_TEST_TRANSACTION_TTL_SECONDS` | `60` | After this many seconds of inactivity, an abandoned session is automatically rolled back, so a crashed test cannot leak a pinned connection until the next restart. |

```bash
CONTEMBER_TEST_TRANSACTIONS=true \
CONTEMBER_TEST_TRANSACTION_TTL_SECONDS=60 \
node ./dist/server.js
```

## How it works

- `POST /test/transaction` creates a **session** and returns a token. No database work happens yet.
- Any Content API request that carries the `X-Contember-Test-Session: <token>` header is served over
  the session's pinned transaction instead of the normal project connection. The transaction is
  opened lazily — once per `(session, project)` — on the **write** connection and serves all reads
  *and* writes, so a later request observes earlier requests' uncommitted changes.
- The application's own `client.transaction()` calls nest as `SAVEPOINT`s inside the pinned
  transaction (the engine's normal behavior), so nothing is committed.
- `DELETE /test/transaction` with the `X-Contember-Test-Session` header rolls back every pinned
  transaction of the session and drops it.

The session header is read explicitly at the Content API controller — connection selection is
deterministic and does not rely on async-context propagation.

:::note
Test transactions only affect the **Content API** (`/content/...`). Tenant and System API requests
are not routed through the pinned transaction.
:::

A request that carries an unknown or expired session token is rejected with HTTP `400`.

## Endpoints

| Method | Path | Headers | Result |
| --- | --- | --- | --- |
| `POST` | `/test/transaction` | — | `200` with `{ "token": "<uuid>" }` |
| `DELETE` | `/test/transaction` | `X-Contember-Test-Session: <token>` | `200` with `{ "ok": true }`, or `404` if the session is unknown |

Then, on each Content API request that should run inside the transaction:

```
X-Contember-Test-Session: <token>
```

## Example

```typescript
const apiUrl = 'http://localhost:4000'

async function withTestTransaction<T>(fn: (sessionHeaders: Record<string, string>) => Promise<T>): Promise<T> {
  const beginRes = await fetch(`${apiUrl}/test/transaction`, { method: 'POST' })
  if (!beginRes.ok) {
    throw new Error(`Failed to begin test transaction (HTTP ${beginRes.status}). Is CONTEMBER_TEST_TRANSACTIONS=true?`)
  }
  const { token } = await beginRes.json() as { token: string }
  try {
    return await fn({ 'X-Contember-Test-Session': token })
  } finally {
    await fetch(`${apiUrl}/test/transaction`, {
      method: 'DELETE',
      headers: { 'X-Contember-Test-Session': token },
    })
  }
}

// Every request inside the callback runs in one transaction that is rolled back afterwards.
await withTestTransaction(async sessionHeaders => {
  await fetch(`${apiUrl}/content/my-project/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>', ...sessionHeaders },
    body: JSON.stringify({ query: `mutation { createAuthor(data: { name: "Kafka" }) { ok } }` }),
  })

  // A later request in the same session sees the uncommitted write above.
  // ...
})
// After the callback the baseline is restored — the author above no longer exists.
```
