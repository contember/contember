import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import { DatabaseContextFactory, SchemaVersionBuilder } from '@contember/engine-system-api'
import { logSentryError } from '../utils'
import { GraphQlSchemaBuilderFactory, PermissionsByIdentityFactory } from '@contember/engine-content-api'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import {
	ProjectConfig,
	ContentQueryHandlerProvider,
	ContentSchemaResolver,
	GraphQlSchemaFactory,
	ProjectContainer, Providers,
} from '@contember/engine-http'
import { ContentQueryHandlerFactory } from '@contember/engine-http'

export class ProjectContainerFactoryFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin[],
		private readonly providers: Providers,
	) {
	}

	create(schemaVersionBuilder: SchemaVersionBuilder): ProjectContainerFactory {
		return new ProjectContainerFactory(this.debug, this.plugins, schemaVersionBuilder, this.providers)
	}
}

export class ProjectContainerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin[],
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: Providers,
	) {}

	public createContainer(project: ProjectConfig): ProjectContainer {
		return this.createBuilder(project)
			.build()
			.pick(
				'project',
				'connection',
				'contentQueryHandlerProvider',
				'systemDatabaseContextFactory',
				'contentSchemaResolver',
			)
	}

	protected createBuilder(project: ProjectConfig) {
		return new Builder({})
			.addService('providers', () =>
				this.providers)
			.addService('schemaVersionBuilder', () =>
				this.schemaVersionBuilder)
			.addService('project', () =>
				project)
			.addService('connection', ({ project }) =>
				new Connection(project.db, { timing: true }))
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
			.addService('contentQueryHandlerFactory', () =>
				new ContentQueryHandlerFactory(project.slug, this.debug, logSentryError))
			.addService('contentSchemaResolver', ({ schemaVersionBuilder }) =>
				new ContentSchemaResolver(schemaVersionBuilder))
			.addService('contentQueryHandlerProvider', ({ contentSchemaResolver, graphQlSchemaFactory, contentQueryHandlerFactory }) =>
				new ContentQueryHandlerProvider(contentSchemaResolver, graphQlSchemaFactory, contentQueryHandlerFactory))
			.addService('systemDatabaseContextFactory', ({ connection, providers }) =>
				new DatabaseContextFactory(connection.createClient('system', { module: 'system' }), providers))
	}
}
