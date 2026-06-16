import { Acl } from '@contember/schema'

/**
 * Splits an update predicate definition into the part that applies to the stored ("old")
 * row and the part that applies to the incoming ("new") row.
 *
 * Semantics:
 * - fields/conditions outside of any `_old`/`_new` marker apply to BOTH states (current behaviour),
 * - a `_old` block applies only to the old state, a `_new` block only to the new state,
 * - for read/create/delete operations there is a single state, so both markers are unwrapped
 *   and merged together (use {@link extractMerged}).
 *
 * The markers are only supported at the top level and inside `and` chains - placing them inside
 * `or`/`not` would change the boolean semantics depending on the state and is rejected by validation.
 */
export class OldNewPredicateExtractor {
	/**
	 * Returns the predicate for the given state. Unwrapped parts are always kept; the matching
	 * marker block is unwrapped, the other marker block is dropped.
	 */
	public extract(definition: Acl.PredicateDefinition, state: Acl.PredicateState): Acl.PredicateDefinition {
		return this.process(definition, state)
	}

	/**
	 * Returns the predicate with both marker blocks unwrapped and merged - used where only a single
	 * state exists (read/create/delete).
	 */
	public extractMerged(definition: Acl.PredicateDefinition): Acl.PredicateDefinition {
		return this.process(definition, undefined)
	}

	/**
	 * Whether the predicate references the old/new markers at all. When it does not, callers can keep
	 * the existing single-where fast path.
	 */
	public hasStateMarkers(definition: Acl.PredicateDefinition): boolean {
		for (const [key, value] of Object.entries(definition)) {
			if (value === undefined) {
				continue
			}
			if (key === Acl.PredicateOldStateMarker || key === Acl.PredicateNewStateMarker) {
				return true
			}
			if (key === 'and' || key === 'or') {
				if ((value as Acl.PredicateDefinition[]).some(it => this.hasStateMarkers(it))) {
					return true
				}
			} else if (key === 'not') {
				if (this.hasStateMarkers(value as Acl.PredicateDefinition)) {
					return true
				}
			}
		}
		return false
	}

	private process(definition: Acl.PredicateDefinition, state: Acl.PredicateState | undefined): Acl.PredicateDefinition {
		const result: Record<string, unknown> = {}
		const merged: Acl.PredicateDefinition[] = []

		for (const [key, value] of Object.entries(definition)) {
			if (value === undefined) {
				continue
			}
			if (key === Acl.PredicateOldStateMarker) {
				if (state === undefined || state === 'old') {
					merged.push(this.process(value as Acl.PredicateDefinition, state))
				}
				continue
			}
			if (key === Acl.PredicateNewStateMarker) {
				if (state === undefined || state === 'new') {
					merged.push(this.process(value as Acl.PredicateDefinition, state))
				}
				continue
			}
			if (key === 'and' || key === 'or') {
				result[key] = (value as Acl.PredicateDefinition[]).map(it => this.process(it, state))
				continue
			}
			if (key === 'not') {
				result.not = this.process(value as Acl.PredicateDefinition, state)
				continue
			}
			result[key] = value
		}

		if (merged.length === 0) {
			return result as Acl.PredicateDefinition
		}
		// fold the unwrapped marker blocks into the result via `and`
		const parts: Acl.PredicateDefinition[] = []
		if (Object.keys(result).length > 0) {
			parts.push(result as Acl.PredicateDefinition)
		}
		parts.push(...merged)
		if (parts.length === 1) {
			return parts[0]
		}
		return { and: parts }
	}
}
