import { Runnable, RunnableArgs, Running, Supervisor, SupervisorOptions } from '@contember/engine-common'
import { ProjectGroupContainerResolver } from '@contember/engine-http'
import { DispatchWorkerSupervisorFactory } from './DispatchWorkerSupervisor.js'

export class LazyDispatchWorker implements Runnable {
	constructor(
		private readonly projectGroupContainerResolver: ProjectGroupContainerResolver,
		private readonly supervisorFactory: DispatchWorkerSupervisorFactory,
		private readonly supervisorOptions: SupervisorOptions = { startupMax: 10 },
	) {
	}

	public async run({ logger, onError }: RunnableArgs): Promise<Running> {
		const running = new Map<string | undefined, Promise<Running | undefined>>()
		let aborted = false

		const unlisten = this.projectGroupContainerResolver.on('create', ({ container, slug }) => {
			const groupLabel = slug ?? '<default>'
			const childLogger = logger.child({ projectGroup: groupLabel })
			childLogger.debug(`Starting dispatch worker for project group ${groupLabel}`)

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
					childLogger.error(e, { message: `Dispatch worker for project group ${groupLabel} crashed` })
					onError(e)
				},
			}).catch(e => {
				if (!aborted) {
					childLogger.error(e, { message: `Failed to start dispatch worker for project group ${groupLabel}` })
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
