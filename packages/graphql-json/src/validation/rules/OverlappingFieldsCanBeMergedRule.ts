/**
 * Overlapping fields can be merged
 *
 * A selection set is only valid if all fields (including spreading any
 * fragments) either correspond to distinct response names or can be merged
 * without ambiguity.
 *
 * Port of graphql-js 16 `OverlappingFieldsCanBeMergedRule`, including its memoization.
 * Types are referenced by name, so parent types are compared by name instead of by identity.
 *
 * See https://spec.graphql.org/draft/#sec-Field-Selection-Merging
 */
import type { ASTVisitor, FieldNode, FragmentDefinitionNode, SelectionSetNode, ValueNode } from 'graphql'
import { GraphQLError, Kind, print } from 'graphql'

import type { Field, Schema, Type, TypeRef } from '../../types/schema.js'
import { isInterfaceType, isLeafType, isObjectType } from '../../types/schema.js'
import { formatTypeRef } from '../../utils/typeRef.js'
import { sortValueNode } from '../sortValueNode.js'
import type { ValidationContext } from '../ValidationContext.js'

type Maybe<T> = T | null | undefined

type Conflict = [ConflictReason, FieldNode[], FieldNode[]]
// Field name and reason.
type ConflictReason = [string, ConflictReasonMessage]
// Reason is a string, or a nested list of conflicts.
type ConflictReasonMessage = string | ConflictReason[]
// A field node in the context of its parent type.
type NodeAndDef = readonly [parentTypeName: Maybe<string>, node: FieldNode, fieldDef: Maybe<Field>]
// Response name to the fields providing it, in selection order.
type NodeAndDefCollection = Map<string, NodeAndDef[]>
type FieldsAndFragmentNames = readonly [NodeAndDefCollection, ReadonlyArray<string>]

interface RuleState {
	readonly context: ValidationContext
	readonly schema: Schema
	readonly cachedFieldsAndFragmentNames: Map<SelectionSetNode, FieldsAndFragmentNames>
	readonly comparedFieldsAndFragmentPairs: OrderedPairSet<NodeAndDefCollection, string>
	readonly comparedFragmentPairs: PairSet<string>
}

function reasonMessage(reason: ConflictReasonMessage): string {
	if (Array.isArray(reason)) {
		return reason
			.map(([responseName, subReason]) => `subfields "${responseName}" conflict because ` + reasonMessage(subReason))
			.join(' and ')
	}
	return reason
}

export function OverlappingFieldsCanBeMergedRule(context: ValidationContext): ASTVisitor {
	const state: RuleState = {
		context,
		schema: context.getSchema(),
		// Memoizes comparisons "between" fields and a fragment or two fragments, which may be requested many times.
		comparedFieldsAndFragmentPairs: new OrderedPairSet(),
		comparedFragmentPairs: new PairSet(),
		cachedFieldsAndFragmentNames: new Map(),
	}

	return {
		SelectionSet(selectionSet) {
			const conflicts = findConflictsWithinSelectionSet(state, context.getParentTypeName(), selectionSet)
			for (const [[responseName, reason], fields1, fields2] of conflicts) {
				const reasonMsg = reasonMessage(reason)
				context.reportError(
					new GraphQLError(
						`Fields "${responseName}" conflict because ${reasonMsg}. Use different aliases on the fields to fetch both if this was intentional.`,
						{ nodes: fields1.concat(fields2) },
					),
				)
			}
		},
	}
}

/**
 * Algorithm (see graphql-js for the full description):
 *
 * A) Each selection set compares "within" its collected fields — the only place fields of one set are compared to each other.
 * B) Fields of a set are compared "between" each fragment it spreads, and C) the spread fragments between each other.
 * D/E) Fields vs. a fragment compares the fields with the fragment's fields and, recursively, with its spread fragments.
 * F/G) Two fragments compare their fields and, recursively, each against the other's spread fragments.
 * H/I/J) Two overlapping fields with selection sets compare their sub-selections the same way.
 */

// Find all conflicts found "within" a selection set, including those found via spreading in fragments.
function findConflictsWithinSelectionSet(
	state: RuleState,
	parentTypeName: Maybe<string>,
	selectionSet: SelectionSetNode,
): Conflict[] {
	const conflicts: Conflict[] = []

	const [fieldMap, fragmentNames] = getFieldsAndFragmentNames(state, parentTypeName, selectionSet)

	// (A) Find all conflicts "within" the fields of this selection set.
	collectConflictsWithin(state, conflicts, fieldMap)

	if (fragmentNames.length !== 0) {
		for (let i = 0; i < fragmentNames.length; i++) {
			// (B) Conflicts between these fields and those represented by each spread fragment.
			collectConflictsBetweenFieldsAndFragment(state, conflicts, false, fieldMap, fragmentNames[i])
			// (C) Conflicts between fragments spread together.
			for (let j = i + 1; j < fragmentNames.length; j++) {
				collectConflictsBetweenFragments(state, conflicts, false, fragmentNames[i], fragmentNames[j])
			}
		}
	}
	return conflicts
}

// Collect all conflicts found between a set of fields and a fragment reference including via spreading in any nested fragments.
function collectConflictsBetweenFieldsAndFragment(
	state: RuleState,
	conflicts: Conflict[],
	areMutuallyExclusive: boolean,
	fieldMap: NodeAndDefCollection,
	fragmentName: string,
): void {
	if (state.comparedFieldsAndFragmentPairs.has(fieldMap, fragmentName, areMutuallyExclusive)) {
		return
	}
	state.comparedFieldsAndFragmentPairs.add(fieldMap, fragmentName, areMutuallyExclusive)

	const fragment = state.context.getFragment(fragmentName)
	if (!fragment) {
		return
	}

	const [fieldMap2, referencedFragmentNames] = getReferencedFieldsAndFragmentNames(state, fragment)

	// Do not compare a fragment's fieldMap to itself.
	if (fieldMap === fieldMap2) {
		return
	}

	// (D) Conflicts between the provided fields and the fields of the given fragment.
	collectConflictsBetween(state, conflicts, areMutuallyExclusive, fieldMap, fieldMap2)

	// (E) Conflicts between the provided fields and any fragment spread in the given fragment.
	for (const referencedFragmentName of referencedFragmentNames) {
		collectConflictsBetweenFieldsAndFragment(state, conflicts, areMutuallyExclusive, fieldMap, referencedFragmentName)
	}
}

// Collect all conflicts found between two fragments, including via spreading in any nested fragments.
function collectConflictsBetweenFragments(
	state: RuleState,
	conflicts: Conflict[],
	areMutuallyExclusive: boolean,
	fragmentName1: string,
	fragmentName2: string,
): void {
	if (fragmentName1 === fragmentName2) {
		return
	}

	if (state.comparedFragmentPairs.has(fragmentName1, fragmentName2, areMutuallyExclusive)) {
		return
	}
	state.comparedFragmentPairs.add(fragmentName1, fragmentName2, areMutuallyExclusive)

	const fragment1 = state.context.getFragment(fragmentName1)
	const fragment2 = state.context.getFragment(fragmentName2)
	if (!fragment1 || !fragment2) {
		return
	}

	const [fieldMap1, referencedFragmentNames1] = getReferencedFieldsAndFragmentNames(state, fragment1)
	const [fieldMap2, referencedFragmentNames2] = getReferencedFieldsAndFragmentNames(state, fragment2)

	// (F) Conflicts between the two collections of fields, not including nested fragments.
	collectConflictsBetween(state, conflicts, areMutuallyExclusive, fieldMap1, fieldMap2)

	// (G) The first fragment against fragments spread in the second.
	for (const referencedFragmentName2 of referencedFragmentNames2) {
		collectConflictsBetweenFragments(state, conflicts, areMutuallyExclusive, fragmentName1, referencedFragmentName2)
	}

	// (G) The second fragment against fragments spread in the first.
	for (const referencedFragmentName1 of referencedFragmentNames1) {
		collectConflictsBetweenFragments(state, conflicts, areMutuallyExclusive, referencedFragmentName1, fragmentName2)
	}
}

// Find all conflicts found between two selection sets, including those found via spreading in fragments.
function findConflictsBetweenSubSelectionSets(
	state: RuleState,
	areMutuallyExclusive: boolean,
	parentTypeName1: Maybe<string>,
	selectionSet1: SelectionSetNode,
	parentTypeName2: Maybe<string>,
	selectionSet2: SelectionSetNode,
): Conflict[] {
	const conflicts: Conflict[] = []

	const [fieldMap1, fragmentNames1] = getFieldsAndFragmentNames(state, parentTypeName1, selectionSet1)
	const [fieldMap2, fragmentNames2] = getFieldsAndFragmentNames(state, parentTypeName2, selectionSet2)

	// (H) Conflicts between the two collections of fields.
	collectConflictsBetween(state, conflicts, areMutuallyExclusive, fieldMap1, fieldMap2)

	// (I) The first collection of fields against each fragment spread in the second.
	for (const fragmentName2 of fragmentNames2) {
		collectConflictsBetweenFieldsAndFragment(state, conflicts, areMutuallyExclusive, fieldMap1, fragmentName2)
	}

	// (I) The second collection of fields against each fragment spread in the first.
	for (const fragmentName1 of fragmentNames1) {
		collectConflictsBetweenFieldsAndFragment(state, conflicts, areMutuallyExclusive, fieldMap2, fragmentName1)
	}

	// (J) Each fragment spread in the first against each fragment spread in the second.
	for (const fragmentName1 of fragmentNames1) {
		for (const fragmentName2 of fragmentNames2) {
			collectConflictsBetweenFragments(state, conflicts, areMutuallyExclusive, fragmentName1, fragmentName2)
		}
	}
	return conflicts
}

// Collect all conflicts "within" one collection of fields.
function collectConflictsWithin(state: RuleState, conflicts: Conflict[], fieldMap: NodeAndDefCollection): void {
	for (const [responseName, fields] of fieldMap) {
		if (fields.length > 1) {
			for (let i = 0; i < fields.length; i++) {
				for (let j = i + 1; j < fields.length; j++) {
					// Within one collection is never mutually exclusive.
					const conflict = findConflict(state, false, responseName, fields[i], fields[j])
					if (conflict) {
						conflicts.push(conflict)
					}
				}
			}
		}
	}
}

// Collect all conflicts between two collections of fields; assumes each was already compared "within".
function collectConflictsBetween(
	state: RuleState,
	conflicts: Conflict[],
	parentFieldsAreMutuallyExclusive: boolean,
	fieldMap1: NodeAndDefCollection,
	fieldMap2: NodeAndDefCollection,
): void {
	for (const [responseName, fields1] of fieldMap1) {
		const fields2 = fieldMap2.get(responseName)
		if (fields2) {
			for (const field1 of fields1) {
				for (const field2 of fields2) {
					const conflict = findConflict(state, parentFieldsAreMutuallyExclusive, responseName, field1, field2)
					if (conflict) {
						conflicts.push(conflict)
					}
				}
			}
		}
	}
}

// Determines if there is a conflict between two particular fields, including comparing their sub-fields.
function findConflict(
	state: RuleState,
	parentFieldsAreMutuallyExclusive: boolean,
	responseName: string,
	field1: NodeAndDef,
	field2: NodeAndDef,
): Maybe<Conflict> {
	const [parentTypeName1, node1, def1] = field1
	const [parentTypeName2, node2, def2] = field2

	// Fields of two different object types can never apply at the same time, so they may diverge.
	// Interfaces and unions may overlap, if not now then in a future version of the schema.
	const areMutuallyExclusive = parentFieldsAreMutuallyExclusive
		|| (parentTypeName1 !== parentTypeName2
			&& isObjectTypeName(state.schema, parentTypeName1)
			&& isObjectTypeName(state.schema, parentTypeName2))

	if (!areMutuallyExclusive) {
		// Two aliases must refer to the same field.
		const name1 = node1.name.value
		const name2 = node2.name.value
		if (name1 !== name2) {
			return [[responseName, `"${name1}" and "${name2}" are different fields`], [node1], [node2]]
		}

		// Two field calls must have the same arguments.
		if (!sameArguments(node1, node2)) {
			return [[responseName, 'they have differing arguments'], [node1], [node2]]
		}
	}

	const type1 = def1?.[0]
	const type2 = def2?.[0]

	if (type1 && type2 && doTypesConflict(state.schema, type1, type2)) {
		return [
			[responseName, `they return conflicting types "${formatTypeRef(type1)}" and "${formatTypeRef(type2)}"`],
			[node1],
			[node2],
		]
	}

	// Collect and compare sub-fields.
	const selectionSet1 = node1.selectionSet
	const selectionSet2 = node2.selectionSet
	if (selectionSet1 && selectionSet2) {
		const conflicts = findConflictsBetweenSubSelectionSets(
			state,
			areMutuallyExclusive,
			type1?.[1],
			selectionSet1,
			type2?.[1],
			selectionSet2,
		)
		return subfieldConflicts(conflicts, responseName, node1, node2)
	}
	return undefined
}

function sameArguments(node1: FieldNode, node2: FieldNode): boolean {
	const args1 = node1.arguments
	const args2 = node2.arguments

	if (args1 === undefined || args1.length === 0) {
		return args2 === undefined || args2.length === 0
	}
	if (args2 === undefined || args2.length === 0) {
		return false
	}

	if (args1.length !== args2.length) {
		return false
	}

	const values2 = new Map(args2.map(({ name, value }) => [name.value, value]))
	return args1.every((arg1) => {
		const value2 = values2.get(arg1.name.value)
		if (value2 === undefined) {
			return false
		}
		return stringifyValue(arg1.value) === stringifyValue(value2)
	})
}

function stringifyValue(value: ValueNode): string {
	return print(sortValueNode(value))
}

// Two types conflict if they could not apply to a value simultaneously: list and non-null wrappers must match,
// and so must leaf types. Composite types are compared later through their sub-fields.
function doTypesConflict(schema: Schema, type1: TypeRef, type2: TypeRef): boolean {
	// A pattern encodes the whole wrapper sequence, so equal patterns mean equal wrappers.
	if (type1[0] !== type2[0]) {
		return true
	}
	if (isLeafTypeName(schema, type1[1]) || isLeafTypeName(schema, type2[1])) {
		return type1[1] !== type2[1]
	}
	return false
}

// Given a selection set, return the fields by response name and the names of fragments it spreads.
function getFieldsAndFragmentNames(
	state: RuleState,
	parentTypeName: Maybe<string>,
	selectionSet: SelectionSetNode,
): FieldsAndFragmentNames {
	const cached = state.cachedFieldsAndFragmentNames.get(selectionSet)
	if (cached) {
		return cached
	}
	const nodeAndDefs: NodeAndDefCollection = new Map()
	const fragmentNames = new Set<string>()
	collectFieldsAndFragmentNames(state.schema, parentTypeName, selectionSet, nodeAndDefs, fragmentNames)
	const result = [nodeAndDefs, [...fragmentNames]] as const
	state.cachedFieldsAndFragmentNames.set(selectionSet, result)
	return result
}

// Given a fragment, return its fields by response name and the names of fragments it spreads.
function getReferencedFieldsAndFragmentNames(state: RuleState, fragment: FragmentDefinitionNode): FieldsAndFragmentNames {
	const cached = state.cachedFieldsAndFragmentNames.get(fragment.selectionSet)
	if (cached) {
		return cached
	}
	const fragmentTypeName = getExistingTypeName(state.schema, fragment.typeCondition.name.value)
	return getFieldsAndFragmentNames(state, fragmentTypeName, fragment.selectionSet)
}

function collectFieldsAndFragmentNames(
	schema: Schema,
	parentTypeName: Maybe<string>,
	selectionSet: SelectionSetNode,
	nodeAndDefs: NodeAndDefCollection,
	fragmentNames: Set<string>,
): void {
	for (const selection of selectionSet.selections) {
		switch (selection.kind) {
			case Kind.FIELD: {
				const fieldName = selection.name.value
				const parentType = getType(schema, parentTypeName)
				let fieldDef: Maybe<Field>
				if (parentType && (isObjectType(parentType) || isInterfaceType(parentType))) {
					fieldDef = Object.hasOwn(parentType[1], fieldName) ? parentType[1][fieldName] : undefined
				}
				const responseName = selection.alias ? selection.alias.value : fieldName
				const fields = nodeAndDefs.get(responseName)
				const nodeAndDef: NodeAndDef = [parentTypeName, selection, fieldDef]
				if (fields) {
					fields.push(nodeAndDef)
				} else {
					nodeAndDefs.set(responseName, [nodeAndDef])
				}
				break
			}
			case Kind.FRAGMENT_SPREAD:
				fragmentNames.add(selection.name.value)
				break
			case Kind.INLINE_FRAGMENT: {
				const typeCondition = selection.typeCondition
				const inlineFragmentTypeName = typeCondition ? getExistingTypeName(schema, typeCondition.name.value) : parentTypeName
				collectFieldsAndFragmentNames(schema, inlineFragmentTypeName, selection.selectionSet, nodeAndDefs, fragmentNames)
				break
			}
		}
	}
}

// Given the conflicts which occurred between two sub-fields, generate a single conflict.
function subfieldConflicts(
	conflicts: ReadonlyArray<Conflict>,
	responseName: string,
	node1: FieldNode,
	node2: FieldNode,
): Maybe<Conflict> {
	if (conflicts.length > 0) {
		return [
			[responseName, conflicts.map(([reason]) => reason)],
			[node1, ...conflicts.flatMap(([, fields1]) => fields1)],
			[node2, ...conflicts.flatMap(([, , fields2]) => fields2)],
		]
	}
	return undefined
}

function getType(schema: Schema, typeName: Maybe<string>): Type | undefined {
	return typeName != null && Object.hasOwn(schema.t, typeName) ? schema.t[typeName] : undefined
}

// Mirrors graphql-js `typeFromAST`, which yields no type for a name the schema does not define.
function getExistingTypeName(schema: Schema, typeName: string): string | undefined {
	return getType(schema, typeName) ? typeName : undefined
}

function isObjectTypeName(schema: Schema, typeName: Maybe<string>): boolean {
	const type = getType(schema, typeName)
	return type !== undefined && isObjectType(type)
}

function isLeafTypeName(schema: Schema, typeName: string): boolean {
	const type = getType(schema, typeName)
	return type !== undefined && isLeafType(type)
}

/**
 * Pairs where the order matters. The flag marks a pair as present only for mutually exclusive comparisons ("weakly")
 * or for all of them.
 */
class OrderedPairSet<T, U> {
	private readonly _data = new Map<T, Map<U, boolean>>()

	has(a: T, b: U, weaklyPresent: boolean): boolean {
		const result = this._data.get(a)?.get(b)
		if (result === undefined) {
			return false
		}
		return weaklyPresent ? true : weaklyPresent === result
	}

	add(a: T, b: U, weaklyPresent: boolean): void {
		const map = this._data.get(a)
		if (map === undefined) {
			this._data.set(a, new Map([[b, weaklyPresent]]))
		} else {
			map.set(b, weaklyPresent)
		}
	}
}

/**
 * Pairs where the order does not matter.
 */
class PairSet<T> {
	private readonly _orderedPairSet = new OrderedPairSet<T, T>()

	has(a: T, b: T, weaklyPresent: boolean): boolean {
		return a < b ? this._orderedPairSet.has(a, b, weaklyPresent) : this._orderedPairSet.has(b, a, weaklyPresent)
	}

	add(a: T, b: T, weaklyPresent: boolean): void {
		if (a < b) {
			this._orderedPairSet.add(a, b, weaklyPresent)
		} else {
			this._orderedPairSet.add(b, a, weaklyPresent)
		}
	}
}
