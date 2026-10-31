import { logger } from '@contember/logger'
import { retryTransaction } from '@contember/database'
import { AfterCommitEvent, BeforeCommitEvent, Mapper, MapperFactory } from '../mapper/index.js'

/**
 * Runs `cb` in a content mutation transaction with the exact commit/event contract the Content API
 * depends on: on success it fires {@link BeforeCommitEvent} (where Actions triggers persist their
 * events / synchronous audit rows), commits, then fires {@link AfterCommitEvent}; on `!ok` it rolls
 * back; serialization failures are retried. Extracted from `MutationResolver.transaction` so
 * engine-internal callers (e.g. retention's `content` strategy) get identical trigger/event semantics
 * without reimplementing this subtle, safety-critical dance.
 *
 * `onCommitError` decides what a commit-time failure yields: the GraphQL resolver turns it into an
 * error response, while a background job typically rethrows so its own error handling records it.
 */
export const runContentMutationTransaction = async <R extends { ok: boolean }>(
	mapperFactory: MapperFactory,
	cb: (mapper: Mapper) => Promise<R>,
	onCommitError: (result: R, error: unknown) => R,
): Promise<R> => {
	return await retryTransaction(
		async () => {
			return await mapperFactory.transaction(async mapper => {
				const result = await cb(mapper)
				if (!result.ok) {
					await mapper.db.connection.rollback()
					return result
				}
				try {
					await mapper.eventManager.fire(new BeforeCommitEvent())
					await mapper.db.connection.commit()
					await mapper.eventManager.fire(new AfterCommitEvent())
				} catch (e) {
					try {
						await mapper.db.connection.rollback()
					} catch {}
					return onCommitError(result, e)
				}
				return result
			})
		},
		message => logger.warn(message),
		{
			maxAttempts: 15,
			minTimeout: 10,
			maxTimeout: 1000,
		},
	)
}
