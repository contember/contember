import { Builder, Container } from '@contember/dic'
import { Connection } from '@contember/database'
import Project from './config/Project'
import { DatabaseContextFactory, SchemaVersionBuilder } from '@contember/engine-system-api'
import { logSentryError } from './utils'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { GraphQlSchemaBuilderFactory, PermissionsByIdentityFactory } from '@contember/engine-content-api'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'
import {
	ContentApolloServerFactory,
	ContentSchemaResolver,
	GraphQlSchemaFactory,
	ContentServerProvider,
	providers,
	graphqlObjectFactories,
} from '@contember/engine-http'

export const createProjectContainer = (
	debug: boolean,
	project: Project,
	plugins: Plugin[],
	schemaVersionBuilder: SchemaVersionBuilder,
) => {
	const projectContainer = new Builder({})
		.addService('providers', () => providers)
		.addService('project', () => project)
		.addService('graphqlObjectsFactory', () => graphqlObjectFactories)
		.addService('connection', ({ project }) => {
			return new Connection(project.db, { timing: true })
		})
		.addService(
			'modificationHandlerFactory',
			() => new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap),
		)

		.addService('graphQlSchemaBuilderFactory', () => new GraphQlSchemaBuilderFactory(graphqlObjectFactories))
		.addService('permissionsByIdentityFactory', ({}) => new PermissionsByIdentityFactory())
		.addService(
			'graphQlSchemaFactory',
			({ graphqlObjectsFactory, project, permissionsByIdentityFactory, graphQlSchemaBuilderFactory }) => {
				const contributors = plugins
					.map(it => (it.getSchemaContributor ? it.getSchemaContributor({ graphqlObjectsFactory, project }) : null))
					.filter((it): it is GraphQLSchemaContributor => !!it)
				return new GraphQlSchemaFactory(graphQlSchemaBuilderFactory, permissionsByIdentityFactory, contributors)
			},
		)
		.addService('apolloServerFactory', () => new ContentApolloServerFactory(project.slug, debug, logSentryError))
		.addService('contentSchemaResolver', () => new ContentSchemaResolver(schemaVersionBuilder))
		.addService(
			'contentServerProvider',
			({ contentSchemaResolver, graphQlSchemaFactory, apolloServerFactory }) =>
				new ContentServerProvider(contentSchemaResolver, graphQlSchemaFactory, apolloServerFactory),
		)
		.addService(
			'systemDatabaseContextFactory',
			({ connection, providers }) =>
				new DatabaseContextFactory(connection.createClient('system', { module: 'system' }), providers),
		)
		.build()
	return projectContainer.pick('project', 'connection', 'contentServerProvider', 'systemDatabaseContextFactory')
}
