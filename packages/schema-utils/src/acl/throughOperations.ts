import { Acl, Writable } from '@contember/schema'

const FIELD_OPERATIONS = ['read', 'create', 'update'] as const

/**
 * Splits an entity's grants into the ones that apply at the query/mutation root and the ones that
 * apply only when the entity is reached through a relation.
 *
 * The two sets are returned separately, sharing one predicate map, so the caller can merge them
 * with its usual predicate-aware merge - `through` grants are additive to the root ones, not a
 * replacement for them.
 *
 * The legacy `noRoot` flag is understood as well: it marked a whole operation as through-only, and
 * schemas migrated before `through` existed still carry it (stored migrations keep patching it). A
 * legacy grant and a declared `through` grant for the same operation are merged, never discarded -
 * the declared one wins on a field both of them name.
 */
export const splitEntityPermissions = (permissions: Acl.EntityPermissions): {
	root: Acl.EntityPermissions
	through: Acl.EntityPermissions
} => {
	const { through: declaredThrough, noRoot, ...rootOperations } = permissions.operations
	const legacyThroughOperations = noRoot ?? []

	if (declaredThrough === undefined && legacyThroughOperations.length === 0) {
		return {
			root: { predicates: permissions.predicates, operations: rootOperations },
			through: { predicates: permissions.predicates, operations: {} },
		}
	}

	const root: Writable<Acl.EntityOperations> = { ...rootOperations }
	const through: Writable<Acl.ThroughOperations> = { ...declaredThrough }

	for (const operation of FIELD_OPERATIONS) {
		if (!legacyThroughOperations.includes(operation)) {
			continue
		}
		const grant = root[operation]
		delete root[operation]
		if (grant === undefined) {
			continue
		}
		// Both grants belong to the through scope, so merge them field-wise instead of picking one - an
		// already declared `through` grant is the current format, so it wins on a field both of them name.
		through[operation] = { ...grant, ...through[operation] }
	}
	if (legacyThroughOperations.includes('delete')) {
		const grant = root.delete
		delete root.delete
		// A single predicate has no empty shape, so an undeclared `through.delete` is exactly `undefined`.
		if (grant !== undefined && through.delete === undefined) {
			through.delete = grant
		}
	}

	return {
		root: { predicates: permissions.predicates, operations: root },
		through: { predicates: permissions.predicates, operations: through },
	}
}
