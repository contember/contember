import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ContentSchemaResolver, ContentQueryHandlerProvider } from './content'
import { ProjectConfig } from './ProjectConfig'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: ProjectConfig
	connection: Connection
	contentQueryHandlerProvider: ContentQueryHandlerProvider
	contentSchemaResolver: ContentSchemaResolver
}

export interface ProjectContainerResolver {
	getProjectContainer(slug: string, aliasFallback?: boolean): Promise<ProjectContainer | undefined>
}

