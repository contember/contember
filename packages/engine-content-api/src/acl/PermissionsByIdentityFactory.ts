import { PermissionFactory } from './PermissionFactory.js'
import { arrayEquals } from '../utils/index.js'
import { Acl, Schema } from '@contember/schema'

export class PermissionsByIdentityFactory {
	public createPermissions(schema: Schema, identity: Identity): PermissionResult {
		return {
			permissions: new PermissionFactory(schema.model).create(schema.acl, identity.projectRoles),
			verifier: otherIdentity => arrayEquals(identity.projectRoles, otherIdentity.projectRoles),
		}
	}
}

export interface Identity {
	projectRoles: string[]
}

export interface PermissionResult {
	permissions: Acl.Permissions
	verifier: (identity: Identity) => boolean
}
