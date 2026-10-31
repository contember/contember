import { EventEmitter, EventManager, PromiseMap } from '@contember/engine-common'
import { isDeepStrictEqual } from 'node:util'
import { ProjectGroupContainer, ProjectGroupContainerFactory } from './ProjectGroupContainer.js'
import { TenantConfigResolver } from '../config/tenantConfigResolver.js'

interface ContainerWithMeta {
	container: ProjectGroupContainer
	cleanups: (() => void)[]
	inputConfig: any
}
export type ProjectGroupContainerResolverEvents = {
	create: (args: { container: ProjectGroupContainer; slug: string | undefined }) => void | (() => void)
}

export class ProjectGroupContainerResolver implements EventEmitter<ProjectGroupContainerResolverEvents> {
	private containers = new PromiseMap<string | undefined, ContainerWithMeta>()
	private eventManager = new EventManager<ProjectGroupContainerResolverEvents>()

	public readonly on = this.eventManager.on.bind(this.eventManager)

	constructor(
		private readonly configResolver: TenantConfigResolver,
		private readonly containerFactory: ProjectGroupContainerFactory,
	) {}

	public async getProjectGroupContainer(slug: string | undefined, config: any = {}): Promise<ProjectGroupContainer> {
		const existing = this.containers.get(slug)
		if (existing) {
			const existingAwaited = await existing
			if (isDeepStrictEqual(config, existingAwaited.inputConfig)) {
				return existingAwaited.container
			}
			existingAwaited.cleanups.forEach(it => it())
			this.containers.delete(slug)
		}
		return (await this.containers.fetch(slug, async slug => {
			const container = this.containerFactory.create({
				config: this.configResolver(slug, config),
				slug,
			})
			const cleanups = this.eventManager.fire('create', { container, slug }).map(it => it ?? (() => null))
			cleanups.push(() => container.projectContainerResolver.dispose())

			await container.tenantContainer.migrationsRunner.run(container.logger.child())
			// §11: after the migrations, so a fresh tenant DB already has the trust table. Detached; never fails creation.
			container.tenantContainer.workloadTokenVerifier
				.prewarm(container.tenantContainer.readDatabaseContext)
				.catch(e => container.logger.error(e, { message: 'Workload identity key prewarm failed' }))
			return { container, inputConfig: config, cleanups }
		})).container
	}
}
