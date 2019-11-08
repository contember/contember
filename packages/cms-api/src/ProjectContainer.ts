import { ProjectWithS3 } from './config/config'
import { ContentApolloMiddlewareFactory, SystemApolloServerFactory } from './http'
import { Container } from '@contember/dic'
import { Client, Connection, DatabaseQueryable } from '@contember/database'
import { SchemaVersionBuilder, SystemExecutionContainer } from '@contember/engine-system-api'
import { MigrationsRunner } from './bootstrap/MigrationsRunner'
import { QueryHandler } from '@contember/queryable'

export type ProjectContainer = Container<{
	project: ProjectWithS3
	systemDbClient: Client
	systemQueryHandler: QueryHandler<DatabaseQueryable>
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
	systemExecutionContainerFactory: SystemExecutionContainer.Factory
	connection: Connection
	systemDbMigrationsRunner: MigrationsRunner
	schemaVersionBuilder: SchemaVersionBuilder
}>

export type ProjectContainerResolver = (slug: string) => ProjectContainer | undefined
