import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ContentQueryHandlerProvider, ContentSchemaResolver } from './content'
import { ProjectConfig } from './ProjectConfig'
import { ProjectGroup } from '@contember/engine-tenant-api'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: ProjectConfig
	connection: Connection
	contentQueryHandlerProvider: ContentQueryHandlerProvider
	contentSchemaResolver: ContentSchemaResolver
}

export interface ProjectContainerResolver {
	getProjectContainer(projectGroup: ProjectGroup, slug: string, aliasFallback?: boolean): Promise<ProjectContainer | undefined>
}

