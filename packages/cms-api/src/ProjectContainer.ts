import { ProjectWithS3 } from './config/config'
import SystemApolloServerFactory from './http/SystemApolloServerFactory'
import ContentApolloMiddlewareFactory from './http/ContentApolloMiddlewareFactory'
import { Container } from '@contember/dic'
import { Client, Connection } from '@contember/database'
import { SchemaVersionBuilder, SystemExecutionContainer } from '@contember/engine-system-api'
import { MigrationsRunner } from './bootstrap/MigrationsRunner'

export type ProjectContainer = Container<{
	project: ProjectWithS3
	systemDbClient: Client
	systemApolloServerFactory: SystemApolloServerFactory
	contentApolloMiddlewareFactory: ContentApolloMiddlewareFactory
	systemExecutionContainerFactory: SystemExecutionContainer.Factory
	connection: Connection
	systemDbMigrationsRunner: MigrationsRunner
	schemaVersionBuilder: SchemaVersionBuilder
}>

export type ProjectContainerResolver = (slug: string) => ProjectContainer | undefined
