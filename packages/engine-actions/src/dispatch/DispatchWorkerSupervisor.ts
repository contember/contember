import { ProjectContainer, ProjectGroupContainer } from '@contember/engine-http'
import { AcquiringListener } from '@contember/database'
import { Runnable, RunnableArgs, Running, Supervisor } from '@contember/engine-common'
import { ProjectDispatcherFactory } from './ProjectDispatcher'
import { Logger } from '@contember/logger'
import { ImplementationException } from '../ImplementationException'

export class DispatchWorkerSupervisorFactory {

	constructor(
		private projectDispatcherFactory: ProjectDispatcherFactory,
	) {
	}

	public create(projectGroup: ProjectGroupContainer): DispatchWorkerSupervisor {
		return new DispatchWorkerSupervisor(this.projectDispatcherFactory, projectGroup)
	}
}

export class DispatchWorkerSupervisor implements Runnable {
	constructor(
		private projectDispatcherFactory: ProjectDispatcherFactory,
		private projectGroup: ProjectGroupContainer,
	) {
	}

	public async run({ logger, onError }: RunnableArgs) {
		const projectGroup = this.projectGroup
		const tenantContainer = projectGroup.tenantContainer
		const projectContainerResolver = projectGroup.projectContainerResolver

		const running = new Map<string, { worker: Promise<Running>; container: ProjectContainer }>()

		const cleanupListener = projectContainerResolver.on('destroy', async ({ container }) => {
			const runningForProject = running.get(container.project.slug)
			if (!runningForProject) {
				return
			}
			running.delete(container.project.slug)
			await (await runningForProject.worker).end()
		})

		const refreshProjectWorker = async (container: ProjectContainer, isReloading: boolean) => {
			const db = container.systemDatabaseContext
			const current = running.get(container.project.slug)
			if (current && current.container === container) {
				return
			}
			const dispatcher = this.projectDispatcherFactory.create({
				db,
				contentSchemaResolver: container.contentSchemaResolver,
				projectSlug: container.project.slug,
			})
			const supervisedDispatcher = new Supervisor(
				dispatcher,
				{ startupMax: isReloading ? Number.MAX_VALUE : 10 },
			)
			const worker = supervisedDispatcher.run({
				logger,
				onError: () => {
					throw new ImplementationException('supervised project dispatcher crashed')
				},
			})
			running.set(container.project.slug, { worker, container })
			try {
				if (current) {
					await (await current.worker).end()
				}
				await worker
				logger.debug('Project dispatch worker started', { project: container.project.slug })
			} catch (e) {
				logger.error(e, { message: 'Project dispatch worker start failed', project: container.project.slug })
				running.delete(container.project.slug)
				throw e
			}
		}
		const projectTracker = new Supervisor(new AcquiringListener(
			tenantContainer.databaseContext.client,
			'project_updated',
			async () => {
				logger.debug('Project config change detected, reloading dispatch workers')
				await endProjectWorkers()
				try {
					await startWorkers(true)
				} catch (e) {
					logger.error(e, { message: 'Dispatch workers reload failed, terminating' })
					await endAll()
					onError(e)
				}
			},
		))

		const runningProjectTracker = await projectTracker.run({
			logger,
			onError: () => {
				throw new ImplementationException('supervised project tracker crashed')
			},
		})
		const fetchProjects = async () => await tenantContainer.projectManager.getProjects(tenantContainer.databaseContext)

		const startWorkers = async (isReloading: boolean) => {
			try {
				const projects = await fetchProjects()
				for (const project of projects) {
					const container = await projectGroup.projectContainerResolver.getProjectContainer(project.slug)
					if (container) {
						await refreshProjectWorker(container, isReloading)
					}
				}
			} catch (e) {
				await endAll()
				throw e
			}
		}
		const endProjectWorkers = async () => {
			const workers = [...running.values()]
			running.clear()
			await Promise.allSettled(workers.map(async ({ worker }) => await (await worker).end()))
		}
		const endAll = async () => {
			logger.debug('Terminating project dispatch workers...')
			cleanupListener()
			try {
				await runningProjectTracker.end()
			} catch {
			}
			await endProjectWorkers()
			logger.debug('Project dispatch workers terminated')
		}

		await startWorkers(false)

		return {
			end: endAll,
		}
	}
}
