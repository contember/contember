import { Acl, Writable } from '@contember/schema'
import { tuple } from '../../utils/index.js'

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
				...(original.operations.through || overrides.operations.through
					? {
						through: this.overrideThroughOperations(
							original.operations.through ?? {},
							overrides.operations.through ?? {},
						),
					}
					: {}),
				...(original.operations.noRoot || overrides.operations.noRoot
					? {
						noRoot: [
							...(original.operations.noRoot || []),
							...(overrides.operations.noRoot || []),
						],
					}
					: {}),
			},
		}
	}

	/**
	 * An operation neither side declares stays absent - an empty map would read as "the through bucket
	 * already grants this operation" and shadow a legacy `noRoot` grant in `splitEntityPermissions`.
	 */
	private overrideThroughOperations(
		original: Acl.ThroughOperations,
		overrides: Acl.ThroughOperations,
	): Acl.ThroughOperations {
		const result: Writable<Acl.ThroughOperations> = {}
		for (const operation of ['create', 'read', 'update'] as const) {
			if (original[operation] === undefined && overrides[operation] === undefined) {
				continue
			}
			result[operation] = { ...(original[operation] || {}), ...(overrides[operation] || {}) }
		}
		if (original.delete !== undefined || overrides.delete !== undefined) {
			result.delete = overrides.delete ?? original.delete
		}
		return result
	}
}
