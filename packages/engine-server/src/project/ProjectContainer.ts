import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import { DatabaseContextFactory, SchemaVersionBuilder } from '@contember/engine-system-api'
import { GraphQlSchemaBuilderFactory, PermissionsByIdentityFactory } from '@contember/engine-content-api'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import {
	ContentSchemaResolver,
	GraphQlSchemaFactory,
	ProjectConfig,
	ProjectContainer,
	Providers,
} from '@contember/engine-http'

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

interface ProjectContainerFactoryArgs {
	project: ProjectConfig
}

export class ProjectContainerFactory {
	constructor(
		private readonly debug: boolean,
		private readonly plugins: Plugin[],
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly providers: Providers,
	) {}

	public createContainer(args: ProjectContainerFactoryArgs): ProjectContainer {
		return this.createBuilder(args)
			.build()
			.pick(
				'project',
				'connection',
				'systemDatabaseContextFactory',
				'contentSchemaResolver',
				'graphQlSchemaFactory',
			)
	}

	protected createBuilder({ project }: ProjectContainerFactoryArgs) {
		return new Builder({})
			.addService('providers', () =>
				this.providers)
			.addService('schemaVersionBuilder', () =>
				this.schemaVersionBuilder)
			.addService('project', () =>
				project)
			.addService('connection', ({ project }) =>
				Connection.create(project.db, {}, { timing: true }))
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
			.addService('systemDatabaseContextFactory', ({ connection, providers, project }) =>
				new DatabaseContextFactory(connection.createClient(project.db.systemSchema ?? 'system', { module: 'system' }), providers))
	}
}
