import { Acl, Writable } from '@contember/schema'

/**
 * A predicate over the stored ("old") and the proposed ("new") row of an update. `both` is a marker-free
 * part that must hold for both rows, `old`/`new` is the content of a `_old`/`_new` marker.
 */
export type StatePredicate<P> =
	| { readonly type: 'both' | 'old' | 'new'; readonly predicate: P }
	| { readonly type: 'and' | 'or'; readonly operands: readonly StatePredicate<P>[] }
	| { readonly type: 'not'; readonly operand: StatePredicate<P> }

/** Whether `_old`/`_new` markers apply to the predicate's own row (top level or within `and`/`or`/`not`). */
export const hasStateMarkers = (definition: Acl.PredicateDefinition): boolean =>
	definition[Acl.PredicateOldStateMarker] !== undefined
	|| definition[Acl.PredicateNewStateMarker] !== undefined
	|| (definition.and ?? []).some(hasStateMarkers)
	|| (definition.or ?? []).some(hasStateMarkers)
	|| (definition.not !== undefined && hasStateMarkers(definition.not))

export const parseStatePredicate = (definition: Acl.PredicateDefinition): StatePredicate<Acl.PredicateDefinition> => {
	if (!hasStateMarkers(definition)) {
		return { type: 'both', predicate: definition }
	}
	const { and, or, not, [Acl.PredicateOldStateMarker]: oldState, [Acl.PredicateNewStateMarker]: newState, ...fields } = definition
	const stateless: Writable<Acl.PredicateDefinition> = { ...fields }
	const operands: StatePredicate<Acl.PredicateDefinition>[] = []

	if (and !== undefined) {
		if (and.some(hasStateMarkers)) {
			operands.push({ type: 'and', operands: and.map(parseStatePredicate) })
		} else {
			stateless.and = and
		}
	}
	if (or !== undefined) {
		if (or.some(hasStateMarkers)) {
			operands.push({ type: 'or', operands: or.map(parseStatePredicate) })
		} else {
			stateless.or = or
		}
	}
	if (not !== undefined) {
		if (hasStateMarkers(not)) {
			operands.push({ type: 'not', operand: parseStatePredicate(not) })
		} else {
			stateless.not = not
		}
	}
	if (oldState !== undefined) {
		operands.push({ type: 'old', predicate: assertMarkerContent(Acl.PredicateOldStateMarker, oldState) })
	}
	if (newState !== undefined) {
		operands.push({ type: 'new', predicate: assertMarkerContent(Acl.PredicateNewStateMarker, newState) })
	}
	if (Object.keys(stateless).length > 0) {
		operands.unshift({ type: 'both', predicate: stateless })
	}
	return operands.length === 1 ? operands[0] : { type: 'and', operands }
}

/** Whether a marker holds a predicate object (rejected otherwise by AclValidator). */
export const isStateMarkerContent = (value: unknown): value is Acl.PredicateDefinition =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const assertMarkerContent = (marker: string, definition: unknown): Acl.PredicateDefinition => {
	// rejected by AclValidator; checked again so an invalid marker can never reach the query
	if (!isStateMarkerContent(definition)) {
		throw new Error(`ACL predicate: the "${marker}" marker must contain a predicate object.`)
	}
	if (hasStateMarkers(definition)) {
		throw new Error('ACL predicate: an "_old"/"_new" marker cannot be nested inside another marker.')
	}
	return definition
}

export const mapStatePredicate = <P, R>(node: StatePredicate<P>, map: (predicate: P) => R): StatePredicate<R> => {
	switch (node.type) {
		case 'both':
		case 'old':
		case 'new':
			return { type: node.type, predicate: map(node.predicate) }
		case 'and':
		case 'or':
			return { type: node.type, operands: node.operands.map(it => mapStatePredicate(it, map)) }
		case 'not':
			return { type: 'not', operand: mapStatePredicate(node.operand, map) }
	}
}

/** The predicate of an operation that sees a single row, which is then both the old and the new one. */
export const resolveSingleStatePredicate = (definition: Acl.PredicateDefinition): Acl.PredicateDefinition => {
	if (!hasStateMarkers(definition)) {
		return definition
	}
	return mergeStates(parseStatePredicate(definition))
}

const mergeStates = (node: StatePredicate<Acl.PredicateDefinition>): Acl.PredicateDefinition => {
	switch (node.type) {
		case 'both':
		case 'old':
		case 'new':
			return node.predicate
		case 'and':
			return { and: node.operands.map(mergeStates) }
		case 'or':
			return { or: node.operands.map(mergeStates) }
		case 'not':
			return { not: mergeStates(node.operand) }
	}
}

/**
 * Whether some proposed row could satisfy the predicate, judged on the stored row alone: every `_new` part
 * counts as satisfiable. Over-approximates when several `_new` parts constrain the same proposed row.
 */
export const resolveOldStateProjection = (definition: Acl.PredicateDefinition): Acl.PredicateDefinition => {
	if (!hasStateMarkers(definition)) {
		return definition
	}
	const projected = projectOldState(parseStatePredicate(definition), true)
	return projected === true ? {} : projected
}

/** Projects `node` (or its negation when `positive` is false); `true` stands for "always satisfiable". */
const projectOldState = (node: StatePredicate<Acl.PredicateDefinition>, positive: boolean): Acl.PredicateDefinition | true => {
	switch (node.type) {
		case 'both':
			// not (old(S) and new(S)) holds whenever the proposed row violates S
			return positive ? node.predicate : true
		case 'old':
			return positive ? node.predicate : { not: node.predicate }
		case 'new':
			return true
		case 'not':
			return projectOldState(node.operand, !positive)
		case 'and':
		case 'or': {
			const parts = node.operands.map(it => projectOldState(it, positive))
			const conjunction = (node.type === 'and') === positive
			const constrained = parts.filter((it): it is Acl.PredicateDefinition => it !== true)
			if (conjunction) {
				return constrained.length === 0 ? true : constrained.length === 1 ? constrained[0] : { and: constrained }
			}
			if (constrained.length < parts.length) {
				return true
			}
			return constrained.length === 1 ? constrained[0] : { or: constrained }
		}
	}
}
