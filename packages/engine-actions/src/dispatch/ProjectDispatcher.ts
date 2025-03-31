import { DatabaseContext } from '@contember/engine-system-api'
import { EventDispatcher } from './EventDispatcher'
import { ContentSchemaResolver } from '@contember/engine-http'
import { Runnable, RunnableArgs, Running } from '@contember/engine-common'
import { Listener } from '@contember/database'
import { NOTIFY_CHANNEL_NAME } from '../utils/notifyChannel'


export class ProjectDispatcherFactory {
	constructor(
		private readonly dispatcher: EventDispatcher,
	) {
	}

	public create({ db, contentSchemaResolver, projectSlug }: { db: DatabaseContext; contentSchemaResolver: ContentSchemaResolver; projectSlug: string}): ProjectDispatcher {
		return new ProjectDispatcher(this.dispatcher, db, contentSchemaResolver, projectSlug)
	}
}



export class ProjectDispatcher implements Runnable {
	constructor(
		private readonly dispatcher: EventDispatcher,
		private readonly db: DatabaseContext,
		private readonly contentSchemaResolver: ContentSchemaResolver,
		private readonly projectSlug: string,
	) {
	}

	public async run({ logger, onError, onClose }: RunnableArgs): Promise<Running> {

		return await new Promise<Running>(async (resolve, reject) => {

			let resolvePending = () => {}
			let rejectPending = (e: any) => {}

			const resolvePendingRef = () => {
				resolvePending()
			}
			let pendingError: any = undefined
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
							logger.info('Worker terminated', {
								succeed: succeedTotal,
								failed: failedTotal,
							})
						},
					})

					try {
						while (!aborted) {
							const { succeed, failed, backoffMs } = await this.dispatcher.processBatch({
								db,
								contentSchemaResolver: this.contentSchemaResolver,
								logger,
							})
							succeedTotal += succeed
							failedTotal += failed

							// listener error occurred during batch processing, rethrow
							if (pendingError) {
								throw pendingError
							}

							// queue is empty, wait
							if (backoffMs !== 0) {
								await new Promise<void>((resolve, reject) => {
									let cleanup = () => {
									}
									if (backoffMs !== undefined) {
										const timeoutHandle = setTimeout(resolve, backoffMs)
										cleanup = () => clearTimeout(timeoutHandle)
									}
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
						onError(e)
					}
				})
			} catch (e) {
				reject(e)
			}
 		})


	}
}
