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
import { ContentSchemaResolver, GraphQLSchemaContributor, GraphQlSchemaFactory, GraphQLSchemaFactoryResult } from '../content'
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
	databaseMetadataResolver: DatabaseMetadataResolver
}

export class ProjectContainerFactoryFactory {
	constructor(
		private readonly plugins: Plugin[],
		private readonly providers: Providers,
		private readonly serverConfig: ServerConfig,
		private readonly graphQlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionFactory,
		private readonly databaseMetadataResolver: DatabaseMetadataResolver,
	) {
	}

	create(schemaVersionBuilder: SchemaVersionBuilder, logger: Logger): ProjectContainerFactory {
		return new ProjectContainerFactory(
			this.plugins,
			schemaVersionBuilder,
			this.providers,
			logger,
			this.serverConfig,
			this.graphQlSchemaBuilderFactory,
			this.permissionFactory,
			this.databaseMetadataResolver,
		)
	}
}

interface ProjectContainerFactoryArgs {
	project: ProjectConfig
}

export class ProjectContainerFactory {
	constructor(
		private readonly plugins: Plugin<any>[],
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: Providers,
		private readonly logger: Logger,
		private readonly serverConfig: ServerConfig,
		private readonly graphQlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionFactory,
		private readonly databaseMetadataResolver: DatabaseMetadataResolver,
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

			.addService('graphqlSchemaCache', () =>
				new ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>({
					ttlSeconds: this.serverConfig.contentApi.schemaCacheTtlSeconds,
				}))
			.addService('graphQlSchemaFactory', ({ project, graphqlSchemaCache }) => {
				const contributors = this.plugins
					.map(it => (it.getSchemaContributor ? it.getSchemaContributor({ project, providers: this.providers }) : null))
					.filter((it): it is GraphQLSchemaContributor => !!it)
				return new GraphQlSchemaFactory(
					graphqlSchemaCache,
					this.graphQlSchemaBuilderFactory,
					this.permissionFactory,
					contributors,
				)
			})
			.addService('contentSchemaResolver', () =>
				new ContentSchemaResolver(this.schemaVersionBuilder))
			.addService('systemSchemaName', ({ project }) =>
				project.db.systemSchema ?? 'system')
			.addService('systemDatabaseContextFactory', ({ systemSchemaName }) =>
				new DatabaseContextFactory(systemSchemaName, this.providers))
			.addService('systemDatabaseContext', ({ connection, systemDatabaseContextFactory }) =>
				systemDatabaseContextFactory.create(connection))
			.addService('systemReadDatabaseContext', ({ readConnection, systemDatabaseContextFactory }) =>
				systemDatabaseContextFactory.create(readConnection))
			.addService('systemMigrationGroups', () =>
				Object.fromEntries(this.plugins.flatMap(it => it.getSystemMigrations ? [[it.name, it.getSystemMigrations()]] : [])))
			.addService('systemMigrationsRunner', ({ systemDatabaseContextFactory, project, systemSchemaName, systemMigrationGroups, databaseMetadataResolver }) =>
				new SystemMigrationsRunner(systemDatabaseContextFactory, { ...project, systemSchema: systemSchemaName }, this.schemaVersionBuilder, systemMigrationGroups, databaseMetadataResolver))
			.addService('projectInitializer', ({ systemMigrationsRunner, systemDatabaseContext, project, systemSchemaName }) =>
				new ProjectInitializer(new StageCreator(), systemMigrationsRunner, systemDatabaseContext, { ...project, systemSchema: systemSchemaName }))
			.addService('projectDatabaseMetadataResolver', () =>
				new ProjectDatabaseMetadataResolver(this.databaseMetadataResolver))
	}
}
