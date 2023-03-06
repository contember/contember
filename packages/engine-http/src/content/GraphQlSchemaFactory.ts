import {
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	Identity,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	PermissionsByIdentityFactory,
	Authorizator,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { GraphQLSchema } from 'graphql'
import { makeExecutableSchema, mergeSchemas } from '@graphql-tools/schema'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor'
import { JSONType } from '@contember/graphql-utils'

type Context = { schema: Schema; identity: Identity }

type CacheEntry = {
	graphQlSchema: GraphQLSchema
	permissions: Acl.Permissions
	contributorsCacheKey: string
	verifier: (identity: Identity) => boolean
}

export class GraphQlSchemaFactory {
	private cache = new WeakMap<Schema, CacheEntry[]>()

	constructor(
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionsByIdentityFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
	) {}

	public create(schema: Schema, identity: Identity): [GraphQLSchema, Acl.Permissions] {
		let cacheEntries = this.cache.get(schema)
		const contributorsCacheKey = this.getContributorsCacheKey({ schema, identity })
		if (cacheEntries !== undefined) {
			const entry = cacheEntries.find(it => it.contributorsCacheKey === contributorsCacheKey && it.verifier(identity))
			if (entry !== undefined) {
				return [entry.graphQlSchema, entry.permissions]
			}
		} else {
			cacheEntries = []
			this.cache.set(schema, cacheEntries)
		}
		const { permissions, verifier } = this.permissionFactory.createPermissions(schema, identity)

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
		cacheEntries.push({ graphQlSchema, verifier, permissions, contributorsCacheKey })

		return [graphQlSchema, permissions]
	}

	private getContributorsCacheKey(ctx: Context): string {
		return JSON.stringify(this.schemaContributors.map(it => it.getCacheKey(ctx)))
	}
}
