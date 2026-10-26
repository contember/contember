import {
	Authorizator,
	ContextualPermissions,
	createGraphQLJsBridge,
	createJsonIntrospectionExtension,
	EntityRulesResolver,
	IntrospectionSchemaFactory,
	JsonContentSchema,
	JsonContentSchemaBuilder,
	JsonContentSchemaShared,
	PermissionFactory,
} from '@contember/engine-content-api'
import { Acl, Schema } from '@contember/schema'
import { createHash } from 'node:crypto'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor.js'
import { Identity } from './Identity.js'
import { ContentApiSpecificCache } from './ContentApiSpecificCache.js'
import { ProjectConfig } from '../project/config.js'

export interface GraphQLSchemaFactoryResult {
	permissions: Acl.Permissions
	allPermissions?: Acl.Permissions
	schema: JsonContentSchema
}

export class GraphQlSchemaFactory {
	private readonly permissionsKeys = new WeakMap<Schema, Map<string, string>>()
	private readonly jsonShared = new WeakMap<Schema, JsonContentSchemaShared>()

	constructor(
		private readonly cache: ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>,
		private readonly permissionFactory: PermissionFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
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
			const introspectionSchemaFactory = new IntrospectionSchemaFactory(
				schema.model,
				new EntityRulesResolver(schema.validation, schema.model),
				authorizator,
			)
			const otherSchemas = this.schemaContributors
				.map(it => it.createSchema({ schema, identity, project }))
				.filter(<T>(it: T | undefined): it is T => it !== undefined)

			const jsonSchema = new JsonContentSchemaBuilder(schema.model, authorizator, rootAuthorizator, this.getJsonShared(schema)).build([
				createJsonIntrospectionExtension(introspectionSchemaFactory),
				...otherSchemas.map(createGraphQLJsBridge),
			])
			return { schema: jsonSchema, permissions, allPermissions }
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
