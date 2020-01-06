import PermissionFactory from './PermissionFactory'
import { arrayEquals } from '../utils'
import { Acl, Schema } from '@contember/schema'

class PermissionsByIdentityFactory {
	public createPermissions(
		schema: Schema,
		identity: PermissionsByIdentityFactory.Identity,
	): PermissionsByIdentityFactory.PermissionResult {
		return {
			permissions: new PermissionFactory(schema.model).create(schema.acl, identity.projectRoles),
			verifier: otherIdentity => arrayEquals(identity.projectRoles, otherIdentity.projectRoles),
		}
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
}

export default PermissionsByIdentityFactory
