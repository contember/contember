import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ProjectConfig } from './config'
import { ContentSchemaResolver, GraphQlSchemaFactory } from './content'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: ProjectConfig
	connection: Connection
	graphQlSchemaFactory: GraphQlSchemaFactory
	contentSchemaResolver: ContentSchemaResolver
}

export interface ProjectContainerResolver {
	onCreate: ((container: ProjectContainer) => void | (() => void))[]

	getAllProjectContainers(): Promise<ProjectContainer[]>
	getProjectContainer(slug: string, aliasFallback?: boolean): Promise<ProjectContainer | undefined>
}

