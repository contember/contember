import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ProjectConfig } from './config'
import { ContentSchemaResolver, GraphQlSchemaFactory } from './content'
import { Logger } from '@contember/logger'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: ProjectConfig
	logger: Logger
	connection: Connection
	graphQlSchemaFactory: GraphQlSchemaFactory
	contentSchemaResolver: ContentSchemaResolver
}

export interface ProjectContainerResolver {
	onCreate: ((container: ProjectContainer) => void | (() => void))[]

	getProjectContainer(slug: string, options?: { alias?: boolean }): Promise<ProjectContainer | undefined>
}

