import { ProjectContainerResolver } from './ProjectContainer.js'
import {
	DatabaseContext,
	ProjectInitializer,
	ProjectSchemaResolver,
	TenantContainer,
} from '@contember/engine-tenant-api'
import { SystemContainer } from '@contember/engine-system-api'
import { Authenticator } from './common/index.js'
import { TenantGraphQLHandler } from './tenant/index.js'
import { SystemGraphQLHandler } from './system/index.js'
import { ProjectMembershipResolver } from './content/index.js'

export interface ProjectGroupContainer {
	slug: string | undefined

	authenticator: Authenticator
	projectMembershipResolver: ProjectMembershipResolver

	projectContainerResolver: ProjectContainerResolver
	projectSchemaResolver: ProjectSchemaResolver
	projectInitializer: ProjectInitializer

	tenantContainer: TenantContainer
	tenantDatabase: DatabaseContext
	tenantGraphQLHandler: TenantGraphQLHandler

	systemContainer: SystemContainer
	systemGraphQLHandler: SystemGraphQLHandler
}
