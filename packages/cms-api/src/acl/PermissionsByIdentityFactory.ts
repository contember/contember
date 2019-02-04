import AllowAllPermissionFactory from './AllowAllPermissionFactory'
import PermissionFactory from './PermissionFactory'
import { arrayEquals } from '../utils/arrays'
import { Acl, Schema } from 'cms-common'
import AuthIdentity from '../common/auth/Identity'

class PermissionsByIdentityFactory {
	constructor(private readonly permissionFactories: PermissionsByIdentityFactory.PermissionFactory[]) {}

	public createPermissions(
		schema: Schema,
		identity: PermissionsByIdentityFactory.Identity
	): PermissionsByIdentityFactory.PermissionResult {
		const permissionFactory = this.permissionFactories.find(it => it.isEligible(identity))
		if (!permissionFactory) {
			throw new Error('No suitable permission factory found')
		}
		return permissionFactory.createPermissions(schema, identity)
	}
}

namespace PermissionsByIdentityFactory {
	export interface Identity {
		globalRoles: string[]
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

	export class SuperAdminPermissionFactory implements PermissionFactory {
		public isEligible(identity: Identity) {
			return identity.globalRoles.includes(AuthIdentity.SystemRole.SUPER_ADMIN)
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

export default PermissionsByIdentityFactory
