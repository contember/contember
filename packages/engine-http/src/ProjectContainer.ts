import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ContentQueryHandlerProvider, ContentSchemaResolver } from './content'
import { ProjectConfig } from './config'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: ProjectConfig
	connection: Connection
	contentQueryHandlerProvider: ContentQueryHandlerProvider
	contentSchemaResolver: ContentSchemaResolver
}

export interface ProjectContainerResolver {
	onCreate: ((container: ProjectContainer) => void | (() => void))[]

	getAllProjectContainers(): Promise<ProjectContainer[]>
	getProjectContainer(slug: string, aliasFallback?: boolean): Promise<ProjectContainer | undefined>
}

