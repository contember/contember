import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ProjectConfig } from './config.js'
import { ContentSchemaResolver, GraphQlSchemaFactory } from './content/index.js'
import { Logger } from '@contember/engine-common'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: ProjectConfig
	connection: Connection
	graphQlSchemaFactory: GraphQlSchemaFactory
	contentSchemaResolver: ContentSchemaResolver
}

export interface ProjectContainerResolver {
	onCreate: ((container: ProjectContainer) => void | (() => void))[]

	getProjectContainer(slug: string, options?: { alias?: boolean; logger?: Logger }): Promise<ProjectContainer | undefined>
}

