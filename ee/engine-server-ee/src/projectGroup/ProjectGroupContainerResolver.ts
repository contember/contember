import { ProjectGroupContainerFactory, TenantConfigResolver } from '@contember/engine-http'
import {
	ProjectGroupContainer,
} from '@contember/engine-http'
import { PromiseMap, EventEmitter, EventManager } from '@contember/engine-common'
import { isDeepStrictEqual } from 'util'

interface ContainerWithMeta {
	container: ProjectGroupContainer
	cleanups: (() => void)[]
	inputConfig: any
}
export type ProjectGroupContainerResolverEvents = {
	create: (args: ({ container: ProjectGroupContainer; slug: string | undefined})) => void | (() => void)
}


export class ProjectGroupContainerResolver implements EventEmitter<ProjectGroupContainerResolverEvents> {
	private containers = new PromiseMap<string | undefined, ContainerWithMeta>()
	private eventManager = new EventManager< ProjectGroupContainerResolverEvents>()

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

			container.projectContainerResolver.on('create', ({ container: projectContainer }) => {
				cleanups.push(() => container.projectContainerResolver.destroyContainer(projectContainer.project.slug))
			})

			await container.tenantContainer.migrationsRunner.run(container.logger.child())
			return { container, inputConfig: config, cleanups }
		})).container
	}
}
