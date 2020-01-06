import PermissionFactory from './PermissionFactory'
import { arrayEquals } from '../utils/arrays'
import { Acl, Schema } from '@contember/schema'
import { filterObject } from '../utils/object'

class PermissionsByIdentityFactory {
	constructor(private readonly permissionFactories: PermissionsByIdentityFactory.PermissionFactory[]) {}

	public createPermissions(
		stageSlug: string,
		schema: Schema,
		identity: PermissionsByIdentityFactory.Identity,
	): PermissionsByIdentityFactory.PermissionResult {
		const permissionFactory = this.permissionFactories.find(it => it.isEligible(identity))
		if (!permissionFactory) {
			throw new Error('No suitable permission factory found')
		}
		return permissionFactory.createPermissions(
			{
				...schema,
				acl: this.extractAclForStage(schema.acl, stageSlug),
			},
			identity,
		)
	}

	private extractAclForStage(acl: Acl.Schema, stageSlug: string): Acl.Schema {
		return {
			...acl,
			roles: filterObject(
				acl.roles,
				(key, value) => value.stages === '*' || !!value.stages.find(pattern => this.matches(stageSlug, pattern)),
			),
		}
	}

	private matches(stageSlug: string, pattern: string): boolean {
		return !!new RegExp(pattern).exec(stageSlug)
	}
}

namespace PermissionsByIdentityFactory {
	export interface Identity {
		projectRoles: string[]
	}

	export interface PermissionResult {
		permissions: Acl.Permissions
		verifier: (identity: Identity) => boolean
	}

	export interface PermissionFactory {
		isEligible(identity: Identity): boolean

		createPermissions(schema: Schema, identity: Identity): PermissionResult
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

export default PermissionsByIdentityFactory
