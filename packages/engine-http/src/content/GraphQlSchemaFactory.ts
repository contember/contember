import { Acl, Schema } from '@contember/schema'
import { GraphQLSchema } from 'graphql'
import {
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	Identity,
	IntrospectionSchemaDefinitionFactory,
	PermissionsByIdentityFactory,
	StaticAuthorizator,
	IntrospectionSchemaFactory,
} from '@contember/engine-content-api'
import { mergeSchemas } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLSchemaContributor } from '@contember/engine-plugins'
import { JSONType } from '@contember/graphql-utils'

type Context = { schema: Schema; identity: Identity }
class GraphQlSchemaFactory {
	private cache: {
		schema: Schema
		cacheKey: string
		entries: {
			graphQlSchema: GraphQLSchema
			permissions: Acl.Permissions
			verifier: (identity: Identity) => boolean
		}[]
	}[] = []

	constructor(
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionsByIdentityFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
	) {}

	private getContributorsCacheKey(ctx: Context): string {
		return JSON.stringify(this.schemaContributors.map(it => it.getCacheKey(ctx)))
	}

	public create(schema: Schema, identity: Identity): [GraphQLSchema, Acl.Permissions] {
		const contributorsCacheKey = this.getContributorsCacheKey({ schema, identity })
		let schemaCacheEntry = this.cache.find(
			it => it.schema.model === schema.model && it.schema.acl === schema.acl && contributorsCacheKey === it.cacheKey,
		)
		if (!schemaCacheEntry) {
			schemaCacheEntry = {
				schema,
				cacheKey: contributorsCacheKey,
				entries: [],
			}
			this.cache.push(schemaCacheEntry)
		} else {
			const entry = schemaCacheEntry.entries.find(it => it.verifier(identity))
			if (entry) {
				return [entry.graphQlSchema, entry.permissions]
			}
		}

		const { permissions, verifier } = this.permissionFactory.createPermissions(schema, identity)

		const authorizator = new StaticAuthorizator(permissions)
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
		schemaCacheEntry.entries.push({ graphQlSchema, verifier, permissions })

		return [graphQlSchema, permissions]
	}
}

export { GraphQlSchemaFactory }
