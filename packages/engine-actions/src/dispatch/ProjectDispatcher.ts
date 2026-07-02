import { DatabaseContext } from '@contember/engine-system-api'
import { EventDispatcher } from './EventDispatcher.js'
import { ContentSchemaResolver } from '@contember/engine-http'
import { Runnable, RunnableArgs, Running } from '@contember/engine-common'
import { Listener } from '@contember/database'
import { NOTIFY_CHANNEL_NAME } from '../utils/notifyChannel.js'
import { ActionsMetrics, ProjectActionsMetrics } from '../ActionsMetrics.js'

/**
 * Upper bound on how long the loop parks while idle. Even when the queue is empty (and we'd
 * otherwise wait indefinitely on a `pg_notify`), we re-check at least this often, so a lost
 * notification self-heals and the heartbeat keeps refreshing while the worker is genuinely idle.
 */
const MAX_IDLE_SLEEP_MS = 30_000

export class ProjectDispatcherFactory {
	constructor(
		private readonly dispatcher: EventDispatcher,
		private readonly metrics: ActionsMetrics,
	) {
	}

	public create(
		{ db, contentSchemaResolver, projectSlug }: { db: DatabaseContext; contentSchemaResolver: ContentSchemaResolver; projectSlug: string },
	): ProjectDispatcher {
		return new ProjectDispatcher(this.dispatcher, db, contentSchemaResolver, projectSlug, this.metrics.forProject(projectSlug))
	}
}

export class ProjectDispatcher implements Runnable {
	constructor(
		private readonly dispatcher: EventDispatcher,
		private readonly db: DatabaseContext,
		private readonly contentSchemaResolver: ContentSchemaResolver,
		private readonly projectSlug: string,
		private readonly metrics: ProjectActionsMetrics,
	) {
	}

	public async run({ logger, onError, onClose }: RunnableArgs): Promise<Running> {
		return await new Promise<Running>(async (resolve, reject) => {
			let resolvePending = () => {}
			let rejectPending = (e: any) => {}

			const resolvePendingRef = () => {
				resolvePending()
			}
			let pendingError: any
			const rejectPendingRef = (e: any) => {
				pendingError = e
				rejectPending(e)
			}

			let succeedTotal = 0
			let failedTotal = 0
			let aborted = false

			try {
				await this.db.scope(async db => {
					const listener = await new Listener<string>(db.client, NOTIFY_CHANNEL_NAME, project => {
						if (project === this.projectSlug) {
							resolvePendingRef()
						}
					})
						.run({ onError: rejectPendingRef, onClose: resolvePendingRef })

					resolve({
						end: async () => {
							aborted = true
							await listener.end()
							this.metrics.dispose()
							logger.info('Worker terminated', {
								succeed: succeedTotal,
								failed: failedTotal,
							})
						},
					})

					try {
						while (!aborted) {
							this.metrics.heartbeat()
							const { succeeded, retried, failedAfterAttempt, failedUnknownTarget, backoffMs } = await this.dispatcher.processBatch({
								db,
								contentSchemaResolver: this.contentSchemaResolver,
								logger,
							})
							const terminalFailed = failedAfterAttempt + failedUnknownTarget
							this.metrics.succeeded(succeeded)
							this.metrics.deliveryAttemptFailed(retried + failedAfterAttempt)
							this.metrics.failed(terminalFailed)
							succeedTotal += succeeded
							failedTotal += terminalFailed

							// listener error occurred during batch processing, rethrow
							if (pendingError) {
								throw pendingError
							}

							// queue is empty (or next retry is in the future), wait — but never longer than
							// MAX_IDLE_SLEEP_MS, so a lost notification self-heals and the heartbeat stays fresh.
							if (backoffMs !== 0) {
								const waitMs = Math.min(backoffMs ?? MAX_IDLE_SLEEP_MS, MAX_IDLE_SLEEP_MS)
								await new Promise<void>((resolve, reject) => {
									const timeoutHandle = setTimeout(resolve, waitMs)
									const cleanup = () => clearTimeout(timeoutHandle)
									resolvePending = () => {
										resolve()
										cleanup()
									}
									rejectPending = e => {
										reject(e)
										cleanup()
									}
								})
							}
						}
						onClose?.()
					} catch (e) {
						await listener.end()
						this.metrics.crashed()
						onError(e)
					}
				})
			} catch (e) {
				reject(e)
			}
		})
	}
}
