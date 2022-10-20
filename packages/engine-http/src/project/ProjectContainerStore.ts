import { PromiseMap } from '@contember/engine-common'
import { ProjectContainer } from './ProjectContainer'

type ContainerWithMeta = { container: ProjectContainer; cleanups: (() => void)[]; timestamp: Date }

export class ProjectContainerStore {
	private containers = new PromiseMap<string, ContainerWithMeta>()
	private aliasMapping = new Map<string, string>()

	public resolveAlias(slug: string): string | undefined {
		return this.aliasMapping.get(slug)
	}

	public setAlias(slug: string, alias: string): void {
		this.aliasMapping.set(alias, slug)
	}

	public removeAlias(alias: string): void {
		this.aliasMapping.delete(alias)
	}

	public getContainer(slug: string): Promise<ContainerWithMeta> | undefined {
		return this.containers.get(slug)
	}

	public async fetchContainer(slug: string, factory: (slug: string) => Promise<ContainerWithMeta>): Promise<ContainerWithMeta> {
		return await this.containers.fetch(slug, factory)
	}

	public removeContainer(slug: string): void {
		this.containers.delete(slug)
	}
}
