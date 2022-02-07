import { ProjectContainerResolver } from './ProjectContainer'
import {
	DatabaseContext,
	ProjectInitializer,
	ProjectSchemaResolver,
	TenantContainer,
} from '@contember/engine-tenant-api'
import { SystemContainer } from '@contember/engine-system-api'
import { KoaMiddleware } from './koa'

export interface ProjectGroupContainer {
	projectContainerResolver: ProjectContainerResolver
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer

	tenantContainer: TenantContainer
	tenantDatabase: DatabaseContext
	tenantGraphQLMiddleware: KoaMiddleware<any>

	systemContainer: SystemContainer
	systemGraphQLMiddleware: KoaMiddleware<any>
}

export interface ProjectGroupContainerResolver {
	getProjectGroupContainer(slug: string | undefined, config: any): Promise<ProjectGroupContainer>
}
