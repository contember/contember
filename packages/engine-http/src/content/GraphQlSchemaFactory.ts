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
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor.js'
import { Identity } from './Identity.js'
import { ContentApiSpecificCache } from './ContentApiSpecificCache.js'
import { ProjectConfig } from '../project/config.js'

export interface GraphQLSchemaFactoryResult {
	permissions: Acl.Permissions
	allPermissions?: Acl.Permissions
	schema: GraphQLSchema
}

export const isMaterializedViewRefreshAllowed = (acl: Acl.Schema, roles: readonly string[]): boolean => {
	const pendingRoles = [...roles]
	const visitedRoles = new Set<string>()
	while (pendingRoles.length > 0) {
		const roleName = pendingRoles.pop()
		if (roleName === undefined || visitedRoles.has(roleName)) {
			continue
		}
		visitedRoles.add(roleName)
		const role = acl.roles[roleName]
		if (role?.content?.refreshMaterializedView) {
			return true
		}
		pendingRoles.push(...(role?.inherits ?? []))
	}
	return false
}

export class GraphQlSchemaFactory {
	constructor(
		private readonly cache: ContentApiSpecificCache<Schema, GraphQLSchemaFactoryResult>,
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactory: PermissionFactory,
		private readonly schemaContributors: GraphQLSchemaContributor[],
	) {}

	public create(schema: Schema, identity: Identity, project: ProjectConfig): GraphQLSchemaFactoryResult {
		const rolesKey = [...identity.projectRoles].sort().join('\xff')
		const contributorsKey = this.schemaContributors.map(it => it.getCacheKey?.({ schema, identity, project }) ?? '').join('\xff')
		const cacheKey = `${rolesKey}\xff\xff${contributorsKey}`

		return this.cache.fetch(schema, cacheKey, () => {
			const { root: permissions, all: allPermissions } = this.permissionFactory.createContextual(schema, identity.projectRoles)

			const authorizator = new Authorizator(
				allPermissions,
				schema.acl.customPrimary ?? false,
				isMaterializedViewRefreshAllowed(schema.acl, identity.projectRoles),
				permissions,
			)
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
				.map(it => it.createSchema({ schema, identity, project }))
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

			return { schema: graphQlSchema, permissions, allPermissions }
		})
	}
}
