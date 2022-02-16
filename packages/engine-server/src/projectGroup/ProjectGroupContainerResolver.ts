import { TenantConfigResolver } from '../config/tenantConfigResolver'
import {
	ProjectGroupContainer,
	ProjectGroupContainerResolver as ProjectGroupContainerResolverInterface,
} from '@contember/engine-http'
import { ProjectGroupContainerFactory } from './ProjectGroupContainer'
import { PromiseMap } from '@contember/engine-common'
import { isDeepStrictEqual } from 'util'

interface ContainerWithMeta {
	container: ProjectGroupContainer
	cleanups: (() => void)[]
	inputConfig: any
}

export class ProjectGroupContainerResolver implements ProjectGroupContainerResolverInterface {
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
			// eslint-disable-next-line no-console
			await container.tenantContainer.migrationsRunner.run(console.log)
			return { container, inputConfig: config, cleanups }
		})).container
	}
}
