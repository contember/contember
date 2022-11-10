import { EventsRepository } from './EventsRepository'
import { TargetHandlerResolver } from './TargetHandlerResolver'
import { HandledEvent } from './types'
import { Logger } from '@contember/logger'
import { ContentSchemaResolver } from '@contember/engine-http'
import { DatabaseContext } from '@contember/engine-system-api'


type ProcessBatchArgs = {
	db: DatabaseContext
	contentSchemaResolver: ContentSchemaResolver
	logger: Logger
}

type ProcessBatchResult = {
	succeed: number
	failed: number
	backoffMs: number | undefined
}

export class EventDispatcher {

	constructor(
		private readonly eventsRepository: EventsRepository,
		private readonly invokeResolver: TargetHandlerResolver,
	) {
	}

	async processBatch({ db, contentSchemaResolver, logger }: ProcessBatchArgs): Promise<ProcessBatchResult> {
		const schema = await contentSchemaResolver.getSchema(db)
		const batch = await this.eventsRepository.fetchBatch(schema.actions, db.client)
		const batchId = Math.random().toString().substring(2)
		const batchLogger = logger.child({ loc: 'Actions.EventDispatcher', batchId })
		if (!batch.ok) {
			batchLogger.debug('Nothing to process', {
				backoffMs: batch.backoffMs ?? 'undefined',
			})
			return { failed: 0, succeed: 0, backoffMs: batch.backoffMs }
		}
		const { target, events } = batch
		try {
			const handler = this.invokeResolver.resolveHandler(target)
			batchLogger.debug('Processing started', {
				events: batch.events.map(it => it.id),
			})
			const handledEvents = await handler.handle(target, events, batchLogger)
			const [succeed, failed] = await this.eventsRepository.persistProcessed(db.client, handledEvents)
			batchLogger.debug('Processing done', { succeed, failed })
			return { succeed, failed, backoffMs: 0 }
		} catch (e) {
			logger.error(e, { loc: 'EventDispatcher', batchId })
			const failedEvents = events.map((it): HandledEvent => ({
				row: it,
				result: { ok: false, errorMessage: `Internal error` },
			}))
			await this.eventsRepository.persistProcessed(db.client, failedEvents)

			return { succeed: 0, failed: batch.events.length, backoffMs: 0 }
		}
	}
}
