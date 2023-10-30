import { Builder } from '@contember/dic'
import { Connection, DatabaseMetadataResolver } from '@contember/database'
import {
	DatabaseContextFactory,
	ProjectInitializer,
	SchemaVersionBuilder,
	StageCreator,
	SystemMigrationsRunner,
	DatabaseContext,
} from '@contember/engine-system-api'
import { GraphQlSchemaBuilderFactory, PermissionFactory } from '@contember/engine-content-api'
import { Logger } from '@contember/logger'
import { ProjectConfig } from './config'
import {
	ContentSchemaResolver,
	GraphQLSchemaContributor,
	GraphQlSchemaFactory,
	GraphQLSchemaFactoryResult,
} from '../content'
import { Providers } from '../providers'
import { Plugin } from '../plugin/Plugin'
import { ServerConfig } from '../config/config'
import { ContentApiSpecificCache } from '../content/ContentApiSpecificCache'
import { Schema } from '@contember/schema'
import { ProjectDatabaseMetadataResolver } from './ProjectDatabaseMetadataResolver'

export interface ProjectContainer {
	systemDatabaseContextFactory: DatabaseContextFactory
	systemDatabaseContext: DatabaseContext
	systemReadDatabaseContext: DatabaseContext
	project: ProjectConfig
	logger: Logger
	connection: Connection
	readConnection: Connection
	graphQlSchemaFactory: GraphQlSchemaFactory
	contentSchemaResolver: ContentSchemaResolver
	projectInitializer: ProjectInitializer
	projectDatabaseMetadataResolver: ProjectDatabaseMetadataResolver
}

export class ProjectContainerFactoryFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin[],
		private readonly providers: Providers,
		private readonly serverConfig: ServerConfig,
	) {
	}

	create(schemaVersionBuilder: SchemaVersionBuilder, logger: Logger): ProjectContainerFactory {
		return new ProjectContainerFactory(
			this.debug,
			this.plugins,
			schemaVersionBuilder,
			this.providers,
			logger,
			this.serverConfig,
		)
	}
}

interface ProjectContainerFactoryArgs {
	project: ProjectConfig
}

export class ProjectContainerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin<any>[],
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: Providers,
		private readonly logger: Logger,
		private readonly serverConfig: ServerConfig,
	) {}

	public createContainer(args: ProjectContainerFactoryArgs): ProjectContainer {
		return this.createBuilder(args)
			.build()
			.pick(
				'project',
				'connection',
				'readConnection',
				'systemDatabaseContextFactory',
				'systemDatabaseContext',
				'systemReadDatabaseContext',
				'contentSchemaResolver',
				'graphQlSchemaFactory',
				'projectInitializer',
				'logger',
				'projectDatabaseMetadataResolver',
			)
	}

	protected createBuilder({ project }: ProjectContainerFactoryArgs) {
		return new Builder({})
			.addService('providers', () =>
				this.providers)
			.addService('schemaVersionBuilder', () =>
				this.schemaVersionBuilder)
			.addService('logger', () =>
				this.logger.child({ project: project.slug }))
			.addService('project', () =>
				project)
			.addService('connection', ({ project, logger }) =>
				Connection.create(project.db, err => logger.error(err)))
			.addService('readConnection', ({ project, logger, connection }) => {
				if (!project.db.read) {
					return connection
				}
				return Connection.create({
					...project.db,
					...project.db.read,
					pool: {
						...project.db.pool,
						...project.db.read.pool,
					},
				}, err => logger.error(err))
			})
			.addService('graphQlSchemaBuilderFactory', () =>
				new GraphQlSchemaBuilderFactory())
			.addService('permissionFactory', ({}) =>
				new PermissionFactory())
			.addService('graphqlSchemaCache', () =>
				new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({
					ttlSeconds: this.serverConfig.contentApi.schemaCacheTtlSeconds,
				}))
			.addService('graphQlSchemaFactory', ({ project, permissionFactory, graphQlSchemaBuilderFactory, providers, graphqlSchemaCache }) => {
				const contributors = this.plugins
					.map(it => (it.getSchemaContributor ? it.getSchemaContributor({ project, providers }) : null))
					.filter((it): it is GraphQLSchemaContributor => !!it)
				return new GraphQlSchemaFactory(
					graphqlSchemaCache,
					graphQlSchemaBuilderFactory,
					permissionFactory,
					contributors,
				)
			})
			.addService('contentSchemaResolver', ({ schemaVersionBuilder }) =>
				new ContentSchemaResolver(schemaVersionBuilder))
			.addService('systemSchemaName', ({ project }) =>
				project.db.systemSchema ?? 'system')
			.addService('systemDatabaseContextFactory', ({ providers, systemSchemaName }) =>
				new DatabaseContextFactory(systemSchemaName, providers))
			.addService('systemDatabaseContext', ({ connection, systemDatabaseContextFactory }) =>
				systemDatabaseContextFactory.create(connection))
			.addService('systemReadDatabaseContext', ({ readConnection, systemDatabaseContextFactory }) =>
				systemDatabaseContextFactory.create(readConnection))
			.addService('systemMigrationGroups', () =>
				Object.fromEntries(this.plugins.flatMap(it => it.getSystemMigrations ? [[it.name, it.getSystemMigrations()]] : [])))
			.addService('databaseMetadataResolver', () =>
				new DatabaseMetadataResolver())
			.addService('systemMigrationsRunner', ({ systemDatabaseContextFactory, project, systemSchemaName, systemMigrationGroups, databaseMetadataResolver }) =>
				new SystemMigrationsRunner(systemDatabaseContextFactory, project, systemSchemaName, this.schemaVersionBuilder, systemMigrationGroups, databaseMetadataResolver))
			.addService('projectInitializer', ({ systemMigrationsRunner, systemDatabaseContext, project }) =>
				new ProjectInitializer(new StageCreator(), systemMigrationsRunner, systemDatabaseContext, project))
			.addService('projectDatabaseMetadataResolver', ({ databaseMetadataResolver }) =>
				new ProjectDatabaseMetadataResolver(databaseMetadataResolver))
	}
}
