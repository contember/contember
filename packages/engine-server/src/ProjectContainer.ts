import { Container } from '@contember/dic'
import { Client, Connection, DatabaseQueryable } from '@contember/database'
import { MigrationsRunner } from '@contember/database-migrations'
import { SchemaVersionBuilder, SystemExecutionContainer } from '@contember/engine-system-api'
import { QueryHandler } from '@contember/queryable'
import Project from './config/Project'
import { ContentApolloMiddlewareFactory, SystemApolloServerFactory } from './http'

export type ProjectContainer = Container<{
	project: Project
	systemDbClient: Client
	systemQueryHandler: QueryHandler<DatabaseQueryable>
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
	systemExecutionContainerFactory: SystemExecutionContainer.Factory
	connection: Connection
	systemDbMigrationsRunner: MigrationsRunner
	schemaVersionBuilder: SchemaVersionBuilder
}>

export type ProjectContainerResolver = (slug: string, aliasFallback?: boolean) => ProjectContainer | undefined
