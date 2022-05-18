import { ProjectGroupContainerFactory, TenantConfigResolver } from '@contember/engine-server'
import { ProjectGroupContainer } from '@contember/engine-http'
export declare class ProjectGroupContainerResolver {
	private readonly configResolver
	private readonly containerFactory
	private containers
	readonly onCreate: ((container: ProjectGroupContainer, slug: string | undefined) => void | (() => void))[]
	constructor(configResolver: TenantConfigResolver, containerFactory: ProjectGroupContainerFactory);
	getProjectGroupContainer(slug: string | undefined, config?: any): Promise<ProjectGroupContainer>;
}
//# sourceMappingURL=ProjectGroupContainerResolver.d.ts.map
