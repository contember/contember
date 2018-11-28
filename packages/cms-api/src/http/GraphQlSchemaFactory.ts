import { Acl, Schema } from 'cms-common'
import { GraphQLSchema } from 'graphql'
import GraphQlSchemaBuilderFactory from '../content-api/graphQLSchema/GraphQlSchemaBuilderFactory'
import TenantIdentity from '../tenant-api/model/type/Identity'
import AllowAllPermissionFactory from '../acl/AllowAllPermissionFactory'
import PermissionFactory from '../acl/PermissionFactory'
import { arrayEquals } from '../utils/arrays'

class GraphQlSchemaFactory {
	private cache: {
		schema: Schema
		entries: {
			graphQlSchema: GraphQLSchema
			verifier: (identity: GraphQlSchemaFactory.Identity) => boolean
		}[]
	}[] = []

	constructor(
		private readonly graphqlSchemaBuilderFactory: GraphQlSchemaBuilderFactory,
		private readonly permissionFactories: GraphQlSchemaFactory.PermissionFactory[]
	) {}

	public create(schema: Schema, identity: GraphQlSchemaFactory.Identity): GraphQLSchema {
		let schemaCacheEntry = this.cache.find(it => it.schema === schema)
		if (!schemaCacheEntry) {
			schemaCacheEntry = {
				schema,
				entries: [],
			}
			this.cache.push(schemaCacheEntry)
		} else {
			const entry = schemaCacheEntry.entries.find(it => it.verifier(identity))
			if (entry) {
				return entry.graphQlSchema
			}
		}

		const permissionFactory = this.permissionFactories.find(it => it.isEligible(identity))
		if (!permissionFactory) {
			throw new Error('No suitable permission factory found')
		}
		const { permissions, verifier } = permissionFactory.createPermissions(schema, identity)

		const dataSchemaBuilder = this.graphqlSchemaBuilderFactory.create(schema.model, permissions)
		const graphQlSchema = dataSchemaBuilder.build()
		schemaCacheEntry.entries.push({ graphQlSchema, verifier })

		return graphQlSchema
	}
}

namespace GraphQlSchemaFactory {
	export interface Identity {
		globalRoles: string[]
		projectRoles: string[]
	}

	interface PermissionResult {
		permissions: Acl.Permissions
		verifier: (identity: Identity) => boolean
	}

	export interface PermissionFactory {
		isEligible(identity: Identity): boolean

		createPermissions(schema: Schema, identity: Identity): PermissionResult
	}

	export class SuperAdminPermissionFactory implements PermissionFactory {
		public isEligible(identity: Identity) {
			return identity.globalRoles.includes(TenantIdentity.SystemRole.SUPER_ADMIN)
		}

		public createPermissions(schema: Schema) {
			return {
				permissions: new AllowAllPermissionFactory().create(schema.model),
				verifier: this.isEligible.bind(this),
			}
		}
	}

	export class RoleBasedPermissionFactory implements PermissionFactory {
		isEligible(identity: Identity): boolean {
			return true
		}

		createPermissions(schema: Schema, identity: Identity): PermissionResult {
			return {
				permissions: new PermissionFactory(schema.model).create(schema.acl, identity.projectRoles),
				verifier: otherIdentity => arrayEquals(identity.projectRoles, otherIdentity.projectRoles),
			}
		}
	}
}

export default GraphQlSchemaFactory
