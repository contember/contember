import { Runnable, RunnableArgs, Running, Supervisor, SupervisorOptions } from '@contember/engine-common'
import { ProjectGroupContainerResolver } from '@contember/engine-http'
import { SchedulerWorkerSupervisorFactory } from './SchedulerWorkerSupervisor.js'

/**
 * Multi-tenant (project-group) variant: lazily spins up a {@link SchedulerWorkerSupervisor} for each
 * project group as it is created, and tears it down on removal. Mirrors the actions LazyDispatchWorker.
 */
export class LazySchedulerWorker implements Runnable {
	constructor(
		private readonly projectGroupContainerResolver: ProjectGroupContainerResolver,
		private readonly supervisorFactory: SchedulerWorkerSupervisorFactory,
		private readonly supervisorOptions: SupervisorOptions = { startupMax: 10 },
	) {
	}

	public async run({ logger, onError }: RunnableArgs): Promise<Running> {
		const running = new Map<string | undefined, Promise<Running | undefined>>()
		let aborted = false

		const unlisten = this.projectGroupContainerResolver.on('create', ({ container, slug }) => {
			const groupLabel = slug ?? '<default>'
			const childLogger = logger.child({ projectGroup: groupLabel })
			childLogger.debug(`Starting scheduler worker for project group ${groupLabel}`)

			const supervised = new Supervisor(
				this.supervisorFactory.create(container),
				this.supervisorOptions,
			)
			const runningPromise: Promise<Running | undefined> = supervised.run({
				logger: childLogger,
				onError: e => {
					if (aborted) {
						return
					}
					childLogger.error(e, { message: `Scheduler worker for project group ${groupLabel} crashed` })
					onError(e)
				},
			}).catch(e => {
				if (!aborted) {
					childLogger.error(e, { message: `Failed to start scheduler worker for project group ${groupLabel}` })
					onError(e)
				}
				return undefined
			})
			running.set(slug, runningPromise)

			return () => {
				running.delete(slug)
				;(async () => {
					try {
						const r = await runningPromise
						await r?.end()
					} catch {
					}
				})()
			}
		})

		return {
			end: async () => {
				aborted = true
				unlisten()
				const all = [...running.values()]
				running.clear()
				await Promise.allSettled(all.map(async p => {
					try {
						const r = await p
						await r?.end()
					} catch {
					}
				}))
			},
		}
	}
}
