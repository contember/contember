/// <reference types="koa-bodyparser" />
import { CryptoWrapper, ProjectGroupContainer } from '@contember/engine-http'
import { Request } from 'koa'
import { ProjectGroupContainerResolver } from './ProjectGroupContainerResolver'
export declare class ProjectGroupResolver {
	private projectGroupDomainMapping
	private projectGroupConfigCrypto
	private projectGroupContainerResolver
	private groupRegex
	private projectGroupConfigHeader
	constructor(projectGroupDomainMapping: string | undefined, projectGroupConfigHeader: string | undefined, projectGroupConfigCrypto: CryptoWrapper | undefined, projectGroupContainerResolver: ProjectGroupContainerResolver)
	resolveContainer({ request }: {
		request: Request
	}): Promise<ProjectGroupContainer>
}
//# sourceMappingURL=ProjectGroupResolver.d.ts.map
