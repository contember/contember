import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import {
	DatabaseContextFactory,
	ProjectInitializer,
	SchemaVersionBuilder,
	StageCreator,
	SystemMigrationsRunner,
} from '@contember/engine-system-api'
import { GraphQlSchemaBuilderFactory, PermissionsByIdentityFactory } from '@contember/engine-content-api'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import {
	ContentSchemaResolver,
	GraphQlSchemaFactory,
	ProjectConfig,
	ProjectContainer,
	Providers,
} from '@contember/engine-http'
import { Logger } from '@contember/logger'
import { MigrationGroup } from '@contember/database-migrations'

export class ProjectContainerFactoryFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin[],
		private readonly providers: Providers,
	) {
	}

	create(schemaVersionBuilder: SchemaVersionBuilder, logger: Logger): ProjectContainerFactory {
		return new ProjectContainerFactory(this.debug, this.plugins, schemaVersionBuilder, this.providers, logger)
	}
}

interface ProjectContainerFactoryArgs {
	project: ProjectConfig
}

export class ProjectContainerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin[],
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: Providers,
		private readonly logger: Logger,
	) {}

	public createContainer(args: ProjectContainerFactoryArgs): ProjectContainer {
		return this.createBuilder(args)
			.build()
			.pick(
				'project',
				'connection',
				'readConnection',
				'systemDatabaseContextFactory',
				'contentSchemaResolver',
				'graphQlSchemaFactory',
				'projectInitializer',
				'logger',
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
			.addService('permissionsByIdentityFactory', ({}) =>
				new PermissionsByIdentityFactory())
			.addService('graphQlSchemaFactory', ({ project, permissionsByIdentityFactory, graphQlSchemaBuilderFactory, providers }) => {
				const contributors = this.plugins
					.map(it => (it.getSchemaContributor ? it.getSchemaContributor({ project, providers }) : null))
					.filter((it): it is GraphQLSchemaContributor => !!it)
				return new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, permissionsByIdentityFactory, contributors)
			})
			.addService('contentSchemaResolver', ({ schemaVersionBuilder }) =>
				new ContentSchemaResolver(schemaVersionBuilder))
			.addService('systemSchemaName', ({ project }) =>
				project.db.systemSchema ?? 'system')
			.addService('systemDatabaseContextFactory', ({ connection, providers, systemSchemaName }) =>
				new DatabaseContextFactory(systemSchemaName, connection, providers))
			.addService('systemMigrationGroups', () =>
				this.plugins.map(it => it.getSystemMigrations?.()).filter((it): it is MigrationGroup => it !== undefined))
			.addService('systemMigrationsRunner', ({ systemDatabaseContextFactory, project, systemSchemaName, systemMigrationGroups }) =>
				new SystemMigrationsRunner(systemDatabaseContextFactory, project, systemSchemaName, this.schemaVersionBuilder, systemMigrationGroups))
			.addService('projectInitializer', ({ systemMigrationsRunner, systemDatabaseContextFactory, project }) =>
				new ProjectInitializer(new StageCreator(), systemMigrationsRunner, systemDatabaseContextFactory, project))
	}
}
