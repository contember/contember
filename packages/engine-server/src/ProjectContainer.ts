import { Builder, Container } from '@contember/dic'
import { Connection } from '@contember/database'
import Project from './config/Project'
import { ContentServerProvider } from './http/content/ContentServerProvider'
import { DatabaseContextFactory, SchemaVersionBuilder } from '@contember/engine-system-api'
import { graphqlObjectFactories, providers } from './utils'
import { ContentApolloServerFactory, ContentSchemaResolver, GraphQlSchemaFactory } from './http/content'
import { ModificationHandlerFactory } from '@contember/schema-migrations'
import { GraphQlSchemaBuilderFactory, PermissionsByIdentityFactory } from '@contember/engine-content-api'
import { GraphQLSchemaContributor, Plugin } from '@contember/engine-plugins'

export type ProjectContainer = Container<{
	systemDatabaseContextFactory: DatabaseContextFactory
	project: Project
	connection: Connection
	contentServerProvider: ContentServerProvider
}>

export type ProjectContainerResolver = (slug: string, aliasFallback?: boolean) => ProjectContainer | undefined

export const createProjectContainer = (
	debug: boolean,
	project: Project,
	projectsDir: string,
	plugins: Plugin[],
	schemaVersionBuilder: SchemaVersionBuilder,
) => {
	const projectContainer = new Builder({})
		.addService('providers', () => providers)
		.addService('project', () => project)
		.addService('projectsDir', () => projectsDir)
		.addService('graphqlObjectsFactory', () => graphqlObjectFactories)
		.addService('connection', ({ project }) => {
			return new Connection(
				{
					host: project.db.host,
					port: project.db.port,
					user: project.db.user,
					password: project.db.password,
					database: project.db.database,
				},
				{ timing: true },
			)
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
		.addService('apolloServerFactory', () => new ContentApolloServerFactory(project.slug, debug))
		.addService('contentSchemaResolver', () => new ContentSchemaResolver(schemaVersionBuilder))
		.addService(
			'contentServerProvider',
			({ contentSchemaResolver, graphQlSchemaFactory, apolloServerFactory }) =>
				new ContentServerProvider(contentSchemaResolver, graphQlSchemaFactory, apolloServerFactory),
		)
		.addService(
			'systemDatabaseContextFactory',
			({ connection, providers }) => new DatabaseContextFactory(connection.createClient('system'), providers),
		)
		.build()
	return projectContainer.pick('project', 'connection', 'contentServerProvider', 'systemDatabaseContextFactory')
}
