import { Acl, Schema } from 'cms-common'
import { GraphQLSchema } from 'graphql'
import GraphQlSchemaBuilderFactory from '../content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import PermissionsByIdentityFactory from '../acl/PermissionsByIdentityFactory'

class GraphQlSchemaFactory {
	private cache: {
		schema: Schema
		entries: {
			graphQlSchema: GraphQLSchema
			permissions: Acl.Permissions
			verifier: (identity: PermissionsByIdentityFactory.Identity) => boolean
		}[]
	}[] = []

	constructor(
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionsByIdentityFactory
	) {}

	public create(
		stageSlug: string,
		schema: Schema,
		identity: PermissionsByIdentityFactory.Identity
	): [GraphQLSchema, Acl.Permissions] {
		let schemaCacheEntry = this.cache.find(it => it.schema.model === schema.model && it.schema.acl === schema.acl)
		if (!schemaCacheEntry) {
			schemaCacheEntry = {
				schema,
				entries: [],
			}
			this.cache.push(schemaCacheEntry)
		} else {
			const entry = schemaCacheEntry.entries.find(it => it.verifier(identity))
			if (entry) {
				return [entry.graphQlSchema, entry.permissions]
			}
		}

		const { permissions, verifier } = this.permissionFactory.createPermissions(stageSlug, schema, identity)

		const dataSchemaBuilder = this.graphqlSchemaBuilderFactory.create(schema.model, permissions)
		const graphQlSchema = dataSchemaBuilder.build()
		schemaCacheEntry.entries.push({ graphQlSchema, verifier, permissions })

		return [graphQlSchema, permissions]
	}
}

export default GraphQlSchemaFactory
