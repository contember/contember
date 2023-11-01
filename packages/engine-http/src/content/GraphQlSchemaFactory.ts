import {
	Authorizator,
	Context,
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionFactory,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { GraphQLFieldConfig, GraphQLNamedType, GraphQLSchema } from 'graphql'
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
			const introspectionSchemaFactory = new IntrospectionSchemaDefinitionFactory(
				new IntrospectionSchemaFactory(
					schema.model,
					new EntityRulesResolver(schema.validation, schema.model),
					authorizator,
				),
			)
			const introspectionSchema = introspectionSchemaFactory.createConfig()

			const otherSchemas = this.schemaContributors
				.map(it => it.createSchema({ schema, identity }))
				.filter(<T>(it: T | undefined): it is T => it !== undefined)

			const queries = new Map<string, GraphQLFieldConfig<any, Context, any>>()
			const mutations = new Map<string, GraphQLFieldConfig<any, Context, any>>()
			const types: GraphQLNamedType[] = []

			for (const schema of [introspectionSchema, ...otherSchemas]) {
				if (schema instanceof GraphQLSchema) {
					for (const [field, config] of Object.entries(schema.getQueryType()?.toConfig().fields ?? {})) {
						queries.set(field, config)
					}
					for (const [field, config] of Object.entries(schema.getQueryType()?.toConfig().fields ?? {})) {
						mutations.set(field, config)
					}
				} else {
					for (const [field, config] of Object.entries(schema.query?.toConfig().fields ?? {})) {
						queries.set(field, config)
					}
					for (const [field, config] of Object.entries(schema.mutation?.toConfig().fields ?? {})) {
						mutations.set(field, config)
					}
					types.push(...(schema.types ?? []))
				}
			}

			const graphQlSchema = dataSchemaBuilder.build({
				mutations,
				queries,
				types,
			})

			return { schema: graphQlSchema, permissions }
		})

	}
}
