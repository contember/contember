import { EventsRepository } from './EventsRepository.js'
import { TargetHandlerResolver } from './TargetHandlerResolver.js'
import { HandledEvent } from './types.js'
import { Logger } from '@contember/logger'
import { ContentSchemaResolver } from '@contember/engine-http'
import { DatabaseContext } from '@contember/engine-system-api'
import { VariablesManager } from '../model/VariablesManager.js'

type ProcessBatchArgs = {
	db: DatabaseContext
	contentSchemaResolver: ContentSchemaResolver
	logger: Logger
}

type ProcessBatchResult = {
	/** Events delivered successfully (terminal). */
	succeeded: number
	/** Failed delivery attempts that will be retried. */
	retried: number
	/** Events terminally failed after a delivery attempt (retries exhausted). */
	failedAfterAttempt: number
	/** Events terminally failed without a delivery attempt (target missing from schema). */
	failedUnknownTarget: number
	backoffMs: number | undefined
}

export class EventDispatcher {
	constructor(
		private readonly eventsRepository: EventsRepository,
		private readonly variablesManager: VariablesManager,
		private readonly invokeResolver: TargetHandlerResolver,
	) {
	}

	async processBatch({ db, contentSchemaResolver, logger }: ProcessBatchArgs): Promise<ProcessBatchResult> {
		const schema = (await contentSchemaResolver.getSchema({ db, normalize: true })).schema
		const batch = await this.eventsRepository.fetchBatch(schema.actions, db.client)
		const batchId = Math.random().toString().substring(2)
		const batchLogger = logger.child({ loc: 'Actions.EventDispatcher', batchId })
		if (!batch.ok) {
			batchLogger.debug('Nothing to process', {
				backoffMs: batch.backoffMs ?? 'undefined',
			})
			return {
				succeeded: 0,
				retried: 0,
				failedAfterAttempt: 0,
				failedUnknownTarget: batch.unknownTargetFailed,
				backoffMs: batch.backoffMs,
			}
		}
		const { target, events } = batch
		try {
			const handler = this.invokeResolver.resolveHandler(target)
			batchLogger.debug('Processing started', {
				events: batch.events.map(it => it.id),
			})
			const variables = await this.variablesManager.fetchVariables(db)
			const handledEvents = await handler.handle({ target, events, logger: batchLogger, variables })
			const { succeeded, retried, failed } = await this.eventsRepository.persistProcessed(db.client, handledEvents)
			batchLogger.debug('Processing done', { succeed: succeeded, failed })
			return {
				succeeded,
				retried,
				failedAfterAttempt: failed,
				failedUnknownTarget: batch.unknownTargetFailed,
				backoffMs: 0,
			}
		} catch (e) {
			logger.error(e, { loc: 'EventDispatcher', batchId })
			const failedEvents = events.map((it): HandledEvent => ({
				row: it,
				result: { ok: false, errorMessage: `Internal error` },
			}))
			const { succeeded, retried, failed } = await this.eventsRepository.persistProcessed(db.client, failedEvents)

			return {
				succeeded,
				retried,
				failedAfterAttempt: failed,
				failedUnknownTarget: batch.unknownTargetFailed,
				backoffMs: 0,
			}
		}
	}
}
