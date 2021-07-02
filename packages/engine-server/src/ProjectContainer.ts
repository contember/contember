import { Builder } from '@contember/dic'
import { Connection } from '@contember/database'
import Project from './config/Project'
import { DatabaseContextFactory, SchemaVersionBuilder } from '@contember/engine-system-api'
import { logSentryError } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { GraphQlSchemaBuilderFactory, PermissionsByIdentityFactory } from '@contember/engine-content-api'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import {
	ContentQueryHandlerProvider,
	ContentSchemaResolver,
	GraphQlSchemaFactory,
	providers,
} from '@contember/engine-http'
import { ContentQueryHandlerFactory } from '@contember/engine-http'

export const createProjectContainer = (
	debug: boolean,
	project: Project,
	plugins: Plugin[],
	schemaVersionBuilder: SchemaVersionBuilder,
) => {
	const projectContainer = new Builder({})
		.addService('providers', () => providers)
		.addService('project', () => project)
		.addService('connection', ({ project }) => {
			return new Connection(project.db, { timing: true })
		})
		.addService(
			'modificationHandlerFactory',
			() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
		)

		.addService('graphQlSchemaBuilderFactory', () => new GraphQlSchemaBuilderFactory())
		.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
		.addService('graphQlSchemaFactory', ({ project, permissionsByIdentityFactory, graphQlSchemaBuilderFactory }) => {
			const contributors = plugins
				.map(it => (it.getSchemaContributor ? it.getSchemaContributor({ project }) : null))
				.filter((it): it is GraphQLSchemaContributor => !!it)
			return new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, permissionsByIdentityFactory, contributors)
		})
		.addService('contentQueryHandlerFactory', () => new ContentQueryHandlerFactory(project.slug, debug, logSentryError))
		.addService('contentSchemaResolver', () => new ContentSchemaResolver(schemaVersionBuilder))
		.addService(
			'contentQueryHandlerProvider',
			({ contentSchemaResolver, graphQlSchemaFactory, contentQueryHandlerFactory }) =>
				new ContentQueryHandlerProvider(contentSchemaResolver, graphQlSchemaFactory, contentQueryHandlerFactory),
		)
		.addService(
			'systemDatabaseContextFactory',
			({ connection, providers }) =>
				new DatabaseContextFactory(connection.createClient('system', { module: 'system' }), providers),
		)
		.build()
	return projectContainer.pick(
		'project',
		'connection',
		'contentQueryHandlerProvider',
		'systemDatabaseContextFactory',
		'contentSchemaResolver',
	)
}
