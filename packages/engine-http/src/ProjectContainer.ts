import Project from './Project'
import { DatabaseContextFactory } from '@contember/engine-system-api'
import { Connection } from '@contember/database'
import { ContentSchemaResolver, ContentServerProvider } from './content'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	project: Project
	connection: Connection
	contentServerProvider: ContentServerProvider
	contentSchemaResolver: ContentSchemaResolver
}

export type ProjectContainerResolver = (slug: string, aliasFallback?: boolean) => Promise<ProjectContainer | undefined>
