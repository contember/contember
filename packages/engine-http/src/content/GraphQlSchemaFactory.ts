import {
	Authorizator,
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { GraphQLFieldConfigMap, GraphQLNamedType, GraphQLObjectType, GraphQLSchema } from 'graphql'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor'
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
			const dataSchema = dataSchemaBuilder.buildConfig()
			const contentSchema = contentSchemaFactory.createConfig()

			const otherSchemas = this.schemaContributors
				.map(it => it.createSchema({ schema, identity }))
				.filter(<T>(it: T | undefined): it is T => it !== undefined)

			const queries: GraphQLFieldConfigMap<any, any> = {}
			const mutations: GraphQLFieldConfigMap<any, any> = {}
			const types: GraphQLNamedType[] = []

			for (const schema of [dataSchema, contentSchema, ...otherSchemas]) {
				if (schema instanceof GraphQLSchema) {
					for (const [field, config] of Object.entries(schema.getQueryType()?.toConfig().fields ?? {})) {
						queries[field] = config
					}
					for (const [field, config] of Object.entries(schema.getQueryType()?.toConfig().fields ?? {})) {
						mutations[field] = config
					}
				} else {
					for (const [field, config] of Object.entries(schema.query?.toConfig().fields ?? {})) {
						queries[field] = config
					}
					for (const [field, config] of Object.entries(schema.mutation?.toConfig().fields ?? {})) {
						mutations[field] = config
					}
					types.push(...(schema.types ?? []))
				}
			}

			const graphQlSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: 'Query',
					fields: queries,
				}),
				...(Object.keys(mutations).length > 0 ? {
					mutation: new GraphQLObjectType({
						name: 'Mutation',
						fields: mutations,
					}),
				} : {}),
				types,
			})

			return { schema: graphQlSchema, permissions }
		})

	}
}
