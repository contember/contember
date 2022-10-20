import { ProjectGroupContainerFactory, TenantConfigResolver } from '@contember/engine-http'
import {
	ProjectGroupContainer,
} from '@contember/engine-http'
import { PromiseMap } from '@contember/engine-common'
import { isDeepStrictEqual } from 'util'

interface ContainerWithMeta {
	container: ProjectGroupContainer
	cleanups: (() => void)[]
	inputConfig: any
}

export class ProjectGroupContainerResolver {
	private containers = new PromiseMap<string | undefined, ContainerWithMeta>()

	public readonly onCreate: ((container: ProjectGroupContainer, slug: string | undefined) => void | (() => void))[] = []

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
			const cleanups = this.onCreate.map(it => it(container, slug) || (() => null))
			await container.tenantContainer.migrationsRunner.run(container.logger.child())
			return { container, inputConfig: config, cleanups }
		})).container
	}
}
