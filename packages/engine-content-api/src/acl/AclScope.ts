import { Model } from '@contember/schema'

/**
 * Where the entity being accessed sits relative to the query or mutation root.
 *
 * `root` resolves against the role's root grants only. `nested` additionally picks up the grants
 * declared with `through: true`, which exist precisely to apply when an entity is reached over a
 * relation and not directly.
 *
 * Every predicate lookup takes one of these explicitly - there is no default. The scope used to be
 * an optional flag that silently fell back to `root`, which is how the whole write path ended up
 * ignoring `through` grants.
 */
export type AclScope = 'root' | 'nested'

/**
 * Derives the scope from a relation path. Callers that already track how deep they are - the select
 * builder, the predicate injector - should use this rather than deciding by hand, so the answer
 * stays correct for every node instead of being computed once at the top and carried down.
 */
export const aclScopeFromPath = (path: readonly Model.AnyRelationContext[] | undefined): AclScope =>
	path === undefined || path.length === 0 ? 'root' : 'nested'
