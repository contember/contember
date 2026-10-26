import {
	Authorizator,
	Context,
	ContextualPermissions,
	createGraphQLJsBridge,
	createJsonIntrospectionExtension,
	EntityRulesResolver,
	GraphQlSchemaBuilderFactory,
	IntrospectionSchemaDefinitionFactory,
	IntrospectionSchemaFactory,
	JsonContentSchema,
	JsonContentSchemaBuilder,
	JsonContentSchemaShared,
	PermissionFactory,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { GraphQLFieldConfig, GraphQLNamedType, GraphQLSchema } from 'graphql'
import { createHash } from 'node:crypto'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor.js'
import { Identity } from './Identity.js'
import { ContentApiSpecificCache } from './ContentApiSpecificCache.js'
import { ProjectConfig } from '../project/config.js'

export type ContentGraphQLEngine = 'graphql-js' | 'graphql-json'

export type ContentGraphQLSchema =
	| { engine: 'graphql-js'; schema: GraphQLSchema }
	| { engine: 'graphql-json'; schema: JsonContentSchema }

export interface GraphQLSchemaFactoryResult {
	permissions: Acl.Permissions
	allPermissions?: Acl.Permissions
	schema: ContentGraphQLSchema
}

export class GraphQlSchemaFactory {
	private readonly permissionsKeys = new WeakMap<Schema, Map<string, string>>()
	private readonly jsonShared = new WeakMap<Schema, JsonContentSchemaShared>()

	constructor(
		private readonly cache: ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
		private readonly engine: ContentGraphQLEngine = 'graphql-js',
	) {}

	public create(schema: Schema, identity: Identity, project: ProjectConfig): GraphQLSchemaFactoryResult {
		const { permissionsKey, computedPermissions } = this.getPermissionsKey(schema, identity.projectRoles)
		const contributorsKey = this.schemaContributors.map(it => it.getCacheKey?.({ schema, identity, project }) ?? '').join('\xff')
		const cacheKey = `${permissionsKey}\xff\xff${contributorsKey}`

		return this.cache.fetch(schema, cacheKey, () => {
			const { root: permissions, all: allPermissions } = computedPermissions ?? this.permissionFactory.createContextual(schema, identity.projectRoles)

			const customPrimary = schema.acl.customPrimary ?? false
			const refreshMaterializedView = this.permissionFactory.isRefreshMaterializedViewAllowed(schema, identity.projectRoles)
			// Types are shaped by the nested set, so a field granted only through a relation still exists
			// on the shared type; the root query and mutation fields are gated on the root set alone.
			const authorizator = new Authorizator(allPermissions, customPrimary, refreshMaterializedView)
			const rootAuthorizator = new Authorizator(permissions, customPrimary, refreshMaterializedView)
			const dataSchemaBuilder = this.graphqlSchemaBuilderFactory.create(schema.model, authorizator, rootAuthorizator)
			const introspectionSchemaFactory = new IntrospectionSchemaFactory(
				schema.model,
				new EntityRulesResolver(schema.validation, schema.model),
				authorizator,
			)
			const otherSchemas = this.schemaContributors
				.map(it => it.createSchema({ schema, identity, project }))
				.filter(<T>(it: T | undefined): it is T => it !== undefined)

			if (this.engine === 'graphql-json') {
				const jsonSchema = new JsonContentSchemaBuilder(schema.model, authorizator, rootAuthorizator, this.getJsonShared(schema)).build([
					createJsonIntrospectionExtension(introspectionSchemaFactory),
					...otherSchemas.map(createGraphQLJsBridge),
				])
				return { schema: { engine: 'graphql-json', schema: jsonSchema }, permissions, allPermissions }
			}

			const introspectionSchema = new IntrospectionSchemaDefinitionFactory(introspectionSchemaFactory).createConfig()

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

			return { schema: { engine: 'graphql-js', schema: graphQlSchema }, permissions, allPermissions }
		})
	}

	private getJsonShared(schema: Schema): JsonContentSchemaShared {
		let shared = this.jsonShared.get(schema)
		if (!shared) {
			shared = new JsonContentSchemaShared()
			this.jsonShared.set(schema, shared)
		}
		return shared
	}

	// Role combinations with identical permissions share one GraphQL schema. The key is memoized per combination,
	// so a request does not rebuild the permissions only to find its schema.
	private getPermissionsKey(
		schema: Schema,
		roles: readonly string[],
	): { permissionsKey: string; computedPermissions?: ContextualPermissions } {
		let keysByRoles = this.permissionsKeys.get(schema)
		if (!keysByRoles) {
			keysByRoles = new Map()
			this.permissionsKeys.set(schema, keysByRoles)
		}
		const rolesKey = [...roles].sort().join('\xff')
		const cachedKey = keysByRoles.get(rolesKey)
		if (cachedKey !== undefined) {
			return { permissionsKey: cachedKey }
		}
		const computedPermissions = this.permissionFactory.createContextual(schema, roles)
		const refreshMaterializedView = this.permissionFactory.isRefreshMaterializedViewAllowed(schema, roles)
		const permissionsKey = createHash('sha256')
			.update(JSON.stringify([computedPermissions.root, computedPermissions.all, refreshMaterializedView]))
			.digest('hex')
		keysByRoles.set(rolesKey, permissionsKey)
		return { permissionsKey, computedPermissions }
	}
}
