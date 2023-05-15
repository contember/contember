import {
	Authorizator,
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { GraphQLSchema } from 'graphql'
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor'
import { JSONType } from '@contember/graphql-utils'
import { Identity } from './Identity'
import { ContentApiSpecificCache } from './ContentApiSpecificCache'

export interface GraphQLSchemaFactoryResult {
	permissions: Acl.Permissions
	schema: GraphQLSchema
}

export class GraphQlSchemaFactory {

	constructor(
		private readonly cache: ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
	) {}

	public create(schema: Schema, identity: Identity): GraphQLSchemaFactoryResult {
		const rolesKey = [...identity.projectRoles].sort().join('\xff')

		return this.cache.fetch(schema, rolesKey, () => {
			const permissions = this.permissionFactory.create(schema, identity.projectRoles)

			const authorizator = new Authorizator(permissions, schema.acl.customPrimary ?? false)
			const dataSchemaBuilder = this.graphqlSchemaBuilderFactory.create(schema.model, authorizator)
			const contentSchemaFactory = new IntrospectionSchemaDefinitionFactory(
				new IntrospectionSchemaFactory(
					schema.model,
					new EntityRulesResolver(schema.validation, schema.model),
					authorizator,
				),
			)
			const dataSchema: GraphQLSchema = dataSchemaBuilder.build()
			const contentSchema = makeExecutableSchema({
				...contentSchemaFactory.create(),
				resolverValidationOptions: {
					requireResolversForResolveType: 'ignore',
				},
			})

			const otherSchemas = this.schemaContributors
				.map(it => it.createSchema({ schema, identity }))
				.filter((it): it is GraphQLSchema => it !== undefined)
			const graphQlSchema = mergeSchemas({
				schemas: [dataSchema, contentSchema, ...otherSchemas],
				resolvers: {
					Json: JSONType,
				},
			})

			return { schema: graphQlSchema, permissions }
		})

	}
}
