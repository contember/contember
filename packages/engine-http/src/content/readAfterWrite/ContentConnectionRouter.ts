import { Connection, EventManager, PinnedConnection } from '@contember/database'
import { DatabaseContext } from '@contember/engine-system-api'
import { Logger } from '@contember/logger'
import { OperationTypeNode } from 'graphql'
import { Timer } from '../../application/index.js'
import { HttpResponse } from '../../common/index.js'
import { errorCompromisesConnection, queryFailureCompromisesConnection } from './connectionHealth.js'
import { databaseErrorAttributes } from './errorLogging.js'
import { isVisibleOnReplica } from './probe.js'
import { ReadAfterTokens } from './token.js'

/** Where a content request runs, and which write refs the serving connection has provably applied. */
export type ContentRoute = {
	readonly connection: Connection.ConnectionType
	readonly systemDatabase: DatabaseContext
	readonly ack: string[] | null
}

/** The connections a content request can be routed to, and the system context of each. */
export type ContentConnections = {
	readonly primary: Connection
	readonly replica: Connection
	readonly systemOnPrimary: DatabaseContext
	readonly systemOnReplica: DatabaseContext
	readonly systemOn: (connection: Connection.ConnectionType) => DatabaseContext
}

export type ContentRouteArgs = {
	readonly connections: ContentConnections
	readonly operation: OperationTypeNode
	/** `null` when read-after-write does not apply: it is off, or this is a mutation or a test session. */
	readonly readAfter: ReadAfterTokens | null
	readonly maxConnectionsPerRequest: number | undefined
	readonly logger: Logger
	readonly timer: Timer
	readonly run: (route: ContentRoute) => Promise<HttpResponse | undefined>
}

type PinnedOutcome =
	| { kind: 'done'; response: HttpResponse | undefined }
	| { kind: 'miss' }
	| { kind: 'error'; error: unknown }

/** Carries a finished outcome out of the pinned scope while still making the pool drop the connection. */
class CompromisedPinnedConnection extends Error {
	constructor(public readonly outcome: PinnedOutcome, public readonly failure: unknown) {
		super('The pinned replica connection is no longer usable')
	}
}

/**
 * Picks the connection a content request runs on. A query carrying write refs may only be served from
 * a replica that has already applied them, and the whole request then stays on that one connection -
 * otherwise a lagging replica could answer the not-modified check wrongly.
 */
export class ContentConnectionRouter {
	async route({
		connections,
		operation,
		readAfter,
		maxConnectionsPerRequest,
		logger,
		timer,
		run,
	}: ContentRouteArgs): Promise<HttpResponse | undefined> {
		// Optionally cap how many pool connections this single request may hold concurrently,
		// so one request cannot starve the shared pool under high concurrency. Defaults to unlimited.
		const cap = (connection: Connection): Connection.ConnectionType =>
			maxConnectionsPerRequest !== undefined ? connection.withMaxConnections(maxConnectionsPerRequest) : connection

		// never log the token values themselves - only how many there were
		const logDecision = (route: 'replica' | 'primary' | 'off', reason?: string) =>
			logger.debug(`readAfterWrite: ${route}`, { tokenCount: readAfter?.tokens.length ?? 0, reason })

		const runOnPrimary = async (reason: string) => {
			logDecision('primary', reason)
			return await run({ connection: cap(connections.primary), systemDatabase: connections.systemOnPrimary, ack: null })
		}

		if (readAfter === null) {
			logDecision('off')
			const readOnly = operation === OperationTypeNode.QUERY
			return await run({
				connection: cap(readOnly ? connections.replica : connections.primary),
				systemDatabase: readOnly ? connections.systemOnReplica : connections.systemOnPrimary,
				ack: null,
			})
		}

		if (!readAfter.valid) {
			// a client or a proxy mangling the header turns the feature off for it, silently and indefinitely
			logger.warn('Read-after-write: the request carried unusable write refs, serving from the primary', {
				tokenCount: readAfter.tokens.length,
			})
			return await runOnPrimary('unusable tokens')
		}

		const tokens = readAfter.tokens
		let replicaAcquired = false
		let outcome: PinnedOutcome
		// The pool decides on release by whether the callback threw, but graphql-js turns a failed
		// resolver into a response - so the connection's own query stream, not the control flow,
		// is what says whether it may serve the next probe.
		const pinnedEvents = new EventManager(connections.replica.eventManager)
		try {
			outcome = await connections.replica.scope(async (acquired): Promise<PinnedOutcome> => {
				replicaAcquired = true
				if (!await timer('ReadAfterWriteProbe', () => isVisibleOnReplica(acquired, readAfter.xids, logger))) {
					return { kind: 'miss' }
				}
				logDecision('replica')
				let compromised: unknown
				// armed only past the probe: a probe that failed says nothing about the connection itself
				pinnedEvents.on(EventManager.Event.queryError, (query, error) => {
					if (compromised === undefined && queryFailureCompromisesConnection(error)) {
						compromised = error
					}
				})
				const pinned = new PinnedConnection(acquired, connections.replica)
				let result: PinnedOutcome
				try {
					result = {
						kind: 'done',
						response: await run({ connection: pinned, systemDatabase: connections.systemOn(pinned), ack: tokens }),
					}
				} catch (e) {
					if (compromised === undefined && errorCompromisesConnection(e)) {
						compromised = e
					}
					result = { kind: 'error', error: e }
				}
				if (compromised !== undefined) {
					// the connection may be left mid-transaction; only throwing makes the pool drop it
					throw new CompromisedPinnedConnection(result, compromised)
				}
				return result
			}, { eventManager: pinnedEvents })
		} catch (e) {
			if (e instanceof CompromisedPinnedConnection) {
				logger.warn('Read-after-write: a statement failed on the pinned replica connection, disposing it', databaseErrorAttributes(e.failure))
				outcome = e.outcome
			} else if (replicaAcquired) {
				// whatever the request itself threw must reach the client
				throw e
			} else {
				logger.warn('Read-after-write: could not acquire a replica connection, serving from the primary', databaseErrorAttributes(e))
				return await runOnPrimary('replica unavailable')
			}
		}
		if (outcome.kind === 'error') {
			throw outcome.error
		}
		if (outcome.kind === 'done') {
			return outcome.response
		}
		return await runOnPrimary('replica behind')
	}
}
