import { Acl, Schema } from '@contember/schema'
import { GraphQLSchema } from 'graphql'
import {
	ContentSchemaFactory,
	GraphQlSchemaBuilderFactory,
	PermissionsByIdentityFactory,
} from '@contember/engine-content-api'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'
import { S3SchemaFactory } from '@contember/engine-s3-plugin'

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
		private readonly permissionFactory: PermissionsByIdentityFactory,
		private readonly s3SchemaFactory?: S3SchemaFactory,
	) {}

	public create(schema: Schema, identity: PermissionsByIdentityFactory.Identity): [GraphQLSchema, Acl.Permissions] {
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

		const { permissions, verifier } = this.permissionFactory.createPermissions(schema, identity)

		const dataSchemaBuilder = this.graphqlSchemaBuilderFactory.create(schema.model, permissions)
		const contentSchemaFactory = new ContentSchemaFactory(schema)
		const dataSchema: GraphQLSchema = dataSchemaBuilder.build()
		const contentSchema = makeExecutableSchema(contentSchemaFactory.create())
		const s3schema = this.s3SchemaFactory ? this.s3SchemaFactory.create({ schema, identity }) : null
		const graphQlSchema = mergeSchemas({ schemas: [dataSchema, contentSchema, ...(s3schema ? [s3schema] : [])] })
		schemaCacheEntry.entries.push({ graphQlSchema, verifier, permissions })

		return [graphQlSchema, permissions]
	}
}

export { GraphQlSchemaFactory }
