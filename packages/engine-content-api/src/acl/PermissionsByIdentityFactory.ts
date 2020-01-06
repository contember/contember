import PermissionFactory from './PermissionFactory'
import { arrayEquals, filterObject } from '../utils'
import { Acl, Schema } from '@contember/schema'

class PermissionsByIdentityFactory {
	public createPermissions(
		stageSlug: string,
		schema: Schema,
		identity: PermissionsByIdentityFactory.Identity,
	): PermissionsByIdentityFactory.PermissionResult {
		return {
			permissions: new PermissionFactory(schema.model).create(
				this.extractAclForStage(schema.acl, stageSlug),
				identity.projectRoles,
			),
			verifier: otherIdentity => arrayEquals(identity.projectRoles, otherIdentity.projectRoles),
		}
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
}

export default PermissionsByIdentityFactory
