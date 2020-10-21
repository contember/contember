import { Acl } from '@contember/schema'
import { tuple } from '../utils'

export default class PermissionOverrider {
	public override(original: Acl.Permissions, overrides: Acl.Permissions): Acl.Permissions {
		return Object.entries({ ...overrides, ...original })
			.map(([key, value]) => {
				if (overrides[key]) {
					return tuple(key, this.overrideEntityPermissions(value, overrides[key]))
				}
				return tuple(key, value)
			})
			.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
	}

	private overrideEntityPermissions(
		original: Acl.EntityPermissions,
		overrides: Acl.EntityPermissions,
	): Acl.EntityPermissions {
		return {
			predicates: { ...original.predicates, ...overrides.predicates },
			operations: {
				create: { ...(original.operations.create || {}), ...(overrides.operations.create || {}) },
				read: { ...(original.operations.read || {}), ...(overrides.operations.read || {}) },
				update: { ...(original.operations.update || {}), ...(overrides.operations.update || {}) },
				...(original.operations.delete === undefined && overrides.operations.delete === undefined
					? {}
					: {
							delete: overrides.operations.delete ?? original.operations.delete,
					  }),
				...(original.operations.customPrimary === undefined && overrides.operations.customPrimary === undefined
					? {}
					: {
							customPrimary: overrides.operations.customPrimary ?? original.operations.customPrimary,
					  }),
			},
		}
	}
}
