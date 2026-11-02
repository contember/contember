import { EventsRepository } from './EventsRepository.js'
import { TargetHandlerResolver } from './TargetHandlerResolver.js'
import { HandledEvent } from './types.js'
import { Logger } from '@contember/logger'
import { ContentSchemaResolver } from '@contember/engine-http'
import { DatabaseContext } from '@contember/engine-system-api'
import { resolveVariable, VariablesManager } from '../model/VariablesManager.js'
import { Tracer } from '@contember/telemetry'
import { UndefinedVariableError } from './WebhookTargetHandler.js'

type ProcessBatchArgs = {
	db: DatabaseContext
	contentSchemaResolver: ContentSchemaResolver
	logger: Logger
	project: { slug: string }
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
		private readonly tracer: Tracer,
	) {
	}

	async processBatch({ db, contentSchemaResolver, logger, project }: ProcessBatchArgs): Promise<ProcessBatchResult> {
		const schema = (await contentSchemaResolver.getSchema({ db, normalize: true })).schema
		const batchId = Math.random().toString().substring(2)
		const batchLogger = logger.child({ loc: 'Actions.EventDispatcher', project: project.slug, batchId })
		const batch = await this.eventsRepository.fetchBatch(schema.actions, db.client, batchLogger)
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
		return await this.tracer.span('actions.dispatch', async span => {
			try {
				const handler = this.invokeResolver.resolveHandler(target)
				batchLogger.debug('Processing started', {
					events: batch.events.map(it => it.id),
				})
				const variables = await this.variablesManager.fetchVariables(db, project.slug)
				const handledEvents = await handler.handle({ target, events, logger: batchLogger, variables })
				const { succeeded, retried, failed } = await this.eventsRepository.persistProcessed(db.client, handledEvents, batchLogger)
				batchLogger.debug('Processing done', { succeed: succeeded, failed })
				span.setAttributes({
					'contember.actions.succeeded': succeeded,
					'contember.actions.retried': retried,
					'contember.actions.failed': failed,
				})
				return {
					succeeded,
					retried,
					failedAfterAttempt: failed,
					failedUnknownTarget: batch.unknownTargetFailed,
					backoffMs: 0,
				}
			} catch (e) {
				if (e instanceof UndefinedVariableError) {
					const { held, joined } = await this.eventsRepository.holdForUndefinedVariables(db.client, {
						target: target.name,
						batch: events.map(it => it.id),
						variables: e.variables,
					})
					const message = 'Webhook target references an undefined variable, its events wait until it is set'
					const attributes = { target: target.name, variables: e.variables, events: held }
					// One warning per target and re-check; an event arriving meanwhile only joins the hold.
					if (joined) {
						batchLogger.debug(message, attributes)
					} else {
						batchLogger.warn(message, attributes)
					}
					span.setAttribute('contember.actions.held', held)
					// setVariables may have committed after the variables were read and before the hold, when it had nothing to release yet.
					const current = await this.variablesManager.fetchVariables(db, project.slug)
					if (e.variables.every(name => resolveVariable(current, name) !== undefined)) {
						await this.eventsRepository.resumeHeldForUndefinedVariables(db.client)
					}
					return {
						succeeded: 0,
						retried: 0,
						failedAfterAttempt: 0,
						failedUnknownTarget: batch.unknownTargetFailed,
						backoffMs: 0,
					}
				}
				span.recordException(e)
				span.setStatus('error')
				batchLogger.error(e)
				const failedEvents = events.map((it): HandledEvent => ({
					row: it,
					result: { ok: false, errorMessage: `Internal error` },
				}))
				const { succeeded, retried, failed } = await this.eventsRepository.persistProcessed(db.client, failedEvents, batchLogger)
				span.setAttributes({
					'contember.actions.succeeded': succeeded,
					'contember.actions.retried': retried,
					'contember.actions.failed': failed,
				})

				return {
					succeeded,
					retried,
					failedAfterAttempt: failed,
					failedUnknownTarget: batch.unknownTargetFailed,
					backoffMs: 0,
				}
			}
		}, {
			kind: 'consumer',
			attributes: {
				'contember.project': project.slug,
				'contember.actions.target': target.name,
				'contember.actions.batch_id': batchId,
				'contember.actions.events': events.length,
			},
		})
	}
}
