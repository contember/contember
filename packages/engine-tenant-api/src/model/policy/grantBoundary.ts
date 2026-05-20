import { Cell, computeGrantableSurface, findUngrantableCells, Policy } from '@contember/policy'
import { DatabaseContext } from '../utils'
import { TenantDbPolicyProvider } from './TenantDbPolicyProvider'

/** The identity performing a policy mutation — its own (global) roles bound the grant. */
export interface PolicyActor {
	readonly id: string
	readonly roles: readonly string[]
}

/**
 * Thrown when a policy mutation would let the actor grant — or lift a deny on —
 * a permission outside its own grantable surface. The single rule: every
 * `(action, resource)` cell of every statement of the touched policy must be
 * covered by the actor's surface, regardless of effect or operation. See
 * `@contember/policy`'s `findUngrantableCells` and the package CLAUDE.md.
 */
export class PolicyBoundaryError extends Error {
	constructor(public readonly violations: readonly Cell[]) {
		const list = violations.map(c => `${c.action} on ${c.resource}`).join(', ')
		super(`Policy exceeds your own permissions — you cannot grant: ${list}`)
	}
}

/**
 * Assert that every given document stays within the actor's grantable surface.
 *
 * The surface is the actor's own *global* effective statements (built-in for its
 * roles + assigned custom policies, tags baked) reduced by `computeGrantableSurface`
 * — i.e. unconditional allows minus deny-guarded cells. Project-membership-derived
 * powers are intentionally excluded (they are synthesized per-project and live in
 * the project schema, not here).
 *
 * Pass multiple documents to check several states at once (e.g. the old and new
 * document of an update — both must be within the surface).
 */
export async function assertWithinGrantableSurface(
	db: DatabaseContext,
	actor: PolicyActor,
	documents: readonly Policy[],
): Promise<void> {
	// Nothing to bound — skip the surface load (and its DB roundtrip) entirely.
	if (documents.every(doc => doc.statements.length === 0)) {
		return
	}
	const statements = await new TenantDbPolicyProvider(db, { id: actor.id, roles: actor.roles }).getStatements({})
	const surface = computeGrantableSurface(statements)
	const violations: Cell[] = []
	const seen = new Set<string>()
	for (const document of documents) {
		for (const cell of findUngrantableCells(surface, document)) {
			const key = `${cell.action} ${cell.resource}`
			if (!seen.has(key)) {
				seen.add(key)
				violations.push(cell)
			}
		}
	}
	if (violations.length > 0) {
		throw new PolicyBoundaryError(violations)
	}
}
