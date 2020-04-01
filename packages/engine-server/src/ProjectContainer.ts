import { Container } from '@contember/dic'
import { Connection } from '@contember/database'
import { DatabaseContextFactory, ProjectInitializer, SchemaVersionBuilder } from '@contember/engine-system-api'
import Project from './config/Project'
import { ContentApolloMiddlewareFactory, SystemApolloServerFactory } from './http'
import { MigrationsRunner } from '@contember/database-migrations'

export type ProjectContainer = Container<{
	project: Project
	connection: Connection
	systemDatabaseContextFactory: DatabaseContextFactory
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
	systemDbMigrationsRunner: MigrationsRunner
	schemaVersionBuilder: SchemaVersionBuilder
	projectInitializer: ProjectInitializer
}>

export type ProjectContainerResolver = (slug: string, aliasFallback?: boolean) => ProjectContainer | undefined
