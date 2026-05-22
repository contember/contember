import { randomUUID } from 'node:crypto'
import { Client, Connection, EventManager } from '@contember/database'

/**
 * HTTP-bound test transactions.
 *
 * Lets a test suite wrap a sequence of HTTP requests in a single database transaction that is
 * rolled back afterwards, so each test starts from the same (already-seeded, committed) baseline
 * without truncating/reseeding.
 *
 * Mechanism:
 *  - `POST /test/transaction` creates a *session* (just a token, no DB work yet).
 *  - The content API controller reads the `X-Contember-Test-Session` header off the request and,
 *    when present, builds its DB client over the session's pinned transaction (via
 *    {@link TestTransactionService.resolveContentClient}) instead of the project connection.
 *    The pinned transaction is opened lazily, once per (session, project), on the *write*
 *    connection and serves all reads + writes — so a later request observes earlier requests'
 *    uncommitted changes.
 *  - The app's own `client.transaction()` calls nest as SAVEPOINTs (existing behaviour), so
 *    nothing is really committed.
 *  - `DELETE /test/transaction` rolls the pinned transaction(s) back and drops the session.
 *
 * The header is read explicitly at the controller (no AsyncLocalStorage), so connection
 * selection is deterministic and does not depend on async-context propagation.
 *
 * Enabled via `serverConfig.test.transactions` (env `CONTEMBER_TEST_TRANSACTIONS`). MUST NOT be
 * enabled in production: a header that pins and holds DB transactions is a trivial DoS /
 * data-visibility hole. Guards:
 *  - hard refusal to construct when enabled together with `NODE_ENV=production`,
 *  - abandoned sessions are auto-rolled-back after a TTL (`serverConfig.test.transactionTtlSeconds`,
 *    env `CONTEMBER_TEST_TRANSACTION_TTL_SECONDS`, default 60s), so a crashed test cannot leak a
 *    pinned connection until restart,
 *  - service methods assert the feature is enabled (belt-and-suspenders on top of route gating).
 */

const SET_ISOLATION_LEVEL = /^\s*set\s+transaction\s+isolation\s+level/i
const DEFAULT_SESSION_TTL_MS = 60_000

interface ParkedTransaction {
	transaction: Connection.TransactionLike
	rollback: () => Promise<void>
}

interface TestSession {
	token: string
	/** Pinned transaction per project slug, opened lazily on first DB access. */
	transactions: Map<string, Promise<ParkedTransaction>>
	/** Wall-clock of the last activity; used to expire abandoned sessions. */
	lastActiveAt: number
}

/**
 * Opens a real transaction (BEGIN) and *parks* it open, returning a handle. The transaction
 * stays open until `rollback()` is called, surviving across multiple HTTP requests.
 *
 * Implemented on top of the callback-scoped `connection.transaction()` API by holding the
 * callback at an internal gate until rollback is requested.
 */
const openParkedTransaction = (connection: Connection): Promise<ParkedTransaction> => {
	return new Promise<ParkedTransaction>((resolveHandle, rejectHandle) => {
		let releaseGate: () => void = () => {}
		const gate = new Promise<void>(resolve => {
			releaseGate = resolve
		})

		const done = connection.transaction(async transaction => {
			resolveHandle({
				transaction,
				rollback: async () => {
					releaseGate()
					await done
				},
			})
			await gate
			if (!transaction.isClosed) {
				await transaction.rollback()
			}
		})

		// surface a failure that happens before the handle is resolved (e.g. BEGIN failed)
		done.catch(rejectHandle)
	})
}

/**
 * Wraps a TransactionLike and turns `SET TRANSACTION ISOLATION LEVEL ...` into a no-op.
 * Inside an already-open transaction (we run the app inside the pinned one), setting the
 * isolation level is illegal in PostgreSQL — and the content API issues it unconditionally
 * at the start of every mutation transaction (MapperFactory). Swallowing it keeps that path
 * working when it nests as a savepoint.
 */
class IsolationFilteringTransaction implements Connection.TransactionLike {
	public readonly on: Connection.TransactionLike['on']

	constructor(private readonly inner: Connection.TransactionLike) {
		this.on = inner.on.bind(inner)
	}

	get eventManager(): EventManager {
		return this.inner.eventManager
	}

	get isClosed(): boolean {
		return this.inner.isClosed
	}

	async scope<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options?: { eventManager?: EventManager },
	): Promise<Result> {
		return this.inner.scope(connection => callback(new IsolationFilteringTransaction(connection)), options)
	}

	async transaction<Result>(
		callback: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options?: { eventManager?: EventManager },
	): Promise<Result> {
		return this.inner.transaction(transaction => callback(new IsolationFilteringTransaction(transaction)), options)
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters: readonly any[] = [],
		meta: Record<string, any> = {},
	): Promise<Connection.Result<Row>> {
		if (SET_ISOLATION_LEVEL.test(sql)) {
			return { command: 'SET', rowCount: null, rows: [] }
		}
		return this.inner.query<Row>(sql, parameters as any[], meta)
	}

	async rollback(): Promise<void> {
		return this.inner.rollback()
	}

	async commit(): Promise<void> {
		return this.inner.commit()
	}
}

export class TestTransactionService {
	private readonly sessions = new Map<string, TestSession>()

	constructor(
		private readonly enabled: boolean,
		private readonly ttlMs: number = DEFAULT_SESSION_TTL_MS,
	) {
		if (enabled && process.env.NODE_ENV === 'production') {
			throw new Error(
				'Test transactions (CONTEMBER_TEST_TRANSACTIONS) must not be enabled with NODE_ENV=production. '
					+ 'This feature pins and holds database connections and exposes uncommitted data — it is a DoS / data-leak vector.',
			)
		}
		if (enabled) {
			// Auto-roll-back abandoned sessions so a crashed test cannot leak a pinned connection.
			const sweep = setInterval(() => this.sweepExpired(), Math.max(1_000, Math.floor(ttlMs / 2)))
			sweep.unref?.()
		}
	}

	public isEnabled(): boolean {
		return this.enabled
	}

	public hasSession(token: string): boolean {
		return this.sessions.has(token)
	}

	private assertEnabled(): void {
		if (!this.enabled) {
			throw new Error('Test transactions are not enabled')
		}
	}

	private sweepExpired(): void {
		const now = Date.now()
		for (const session of [...this.sessions.values()]) {
			if (now - session.lastActiveAt > this.ttlMs) {
				void this.rollback(session.token)
			}
		}
	}

	/** Create a new session and return its token. No DB work happens here. */
	public begin(): string {
		this.assertEnabled()
		const token = randomUUID()
		this.sessions.set(token, { token, transactions: new Map(), lastActiveAt: Date.now() })
		return token
	}

	/** Roll back every pinned transaction of the session and drop it. */
	public async rollback(token: string): Promise<boolean> {
		const session = this.sessions.get(token)
		if (!session) {
			return false
		}
		this.sessions.delete(token)
		await Promise.all(
			[...session.transactions.values()].map(async parked => {
				try {
					await (await parked).rollback()
				} catch {
					// connection may already be gone; nothing to roll back to
				}
			}),
		)
		return true
	}

	/**
	 * Build a content-API DB client backed by the session's pinned transaction for `projectSlug`,
	 * opening (and pinning) that transaction on `writeConnection` on first use.
	 * Returns undefined when the token does not refer to a known session.
	 */
	public async resolveContentClient(
		token: string,
		projectSlug: string,
		writeConnection: Connection,
		schema: string,
		queryMeta: Record<string, any>,
	): Promise<Client | undefined> {
		this.assertEnabled()
		const session = this.sessions.get(token)
		if (!session) {
			return undefined
		}
		session.lastActiveAt = Date.now()
		let parked = session.transactions.get(projectSlug)
		if (!parked) {
			parked = openParkedTransaction(writeConnection)
			session.transactions.set(projectSlug, parked)
		}
		const transaction = new IsolationFilteringTransaction((await parked).transaction)
		return new Client(transaction, schema, queryMeta, new EventManager(transaction.eventManager))
	}
}
