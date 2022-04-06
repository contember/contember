import { ProjectContainerResolver } from './ProjectContainer'
import {
	DatabaseContext,
	ProjectInitializer,
	ProjectSchemaResolver,
	TenantContainer,
} from '@contember/engine-tenant-api'
import { SystemContainer } from '@contember/engine-system-api'
import { Authenticator } from './common'
import { TenantGraphQLHandler } from './tenant'
import { SystemGraphQLHandler } from './system'

export interface ProjectGroupContainer {
	slug: string | undefined

	authenticator: Authenticator

	projectContainerResolver: ProjectContainerResolver
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer

	tenantContainer: TenantContainer
	tenantDatabase: DatabaseContext
	tenantGraphQLHandler: TenantGraphQLHandler

	systemContainer: SystemContainer
	systemGraphQLHandler: SystemGraphQLHandler
}
