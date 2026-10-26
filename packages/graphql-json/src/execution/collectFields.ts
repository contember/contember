/**
 * Field collection from selection set
 */

import { Kind } from 'graphql'
import type { FieldNode, FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode, SelectionSetNode } from 'graphql'
import type { InterfaceType, Schema, UnionType } from '../types/schema.js'
import { isAbstractType, isObjectType, TypeKind } from '../types/schema.js'
import { getOwn } from '../utils/helpers.js'
import { getDirectiveValues } from './directives.js'

export type FieldGroup = readonly FieldNode[]
export type GroupedFieldSet = Map<string, FieldGroup>

/**
 * Collect fields from a selection set
 */
export function collectFields(
	schema: Schema,
	fragments: Record<string, FragmentDefinitionNode>,
	variableValues: Record<string, unknown>,
	runtimeTypeName: string,
	selectionSet: SelectionSetNode,
): GroupedFieldSet {
	const groupedFieldSet = new Map<string, FieldNode[]>()
	const visitedFragmentNames = new Set<string>()

	collectFieldsImpl(
		schema,
		fragments,
		variableValues,
		runtimeTypeName,
		selectionSet,
		groupedFieldSet,
		visitedFragmentNames,
	)

	return groupedFieldSet
}

function collectFieldsImpl(
	schema: Schema,
	fragments: Record<string, FragmentDefinitionNode>,
	variableValues: Record<string, unknown>,
	runtimeTypeName: string,
	selectionSet: SelectionSetNode,
	groupedFieldSet: Map<string, FieldNode[]>,
	visitedFragmentNames: Set<string>,
): void {
	for (const selection of selectionSet.selections) {
		switch (selection.kind) {
			case Kind.FIELD: {
				if (!shouldIncludeNode(selection, variableValues)) {
					continue
				}
				const responseKey = getFieldResponseKey(selection)
				const existingGroup = groupedFieldSet.get(responseKey)
				if (existingGroup) {
					existingGroup.push(selection)
				} else {
					groupedFieldSet.set(responseKey, [selection])
				}
				break
			}

			case Kind.INLINE_FRAGMENT: {
				if (
					!shouldIncludeNode(selection, variableValues)
					|| !doesFragmentConditionMatch(schema, selection, runtimeTypeName)
				) {
					continue
				}
				collectFieldsImpl(
					schema,
					fragments,
					variableValues,
					runtimeTypeName,
					selection.selectionSet,
					groupedFieldSet,
					visitedFragmentNames,
				)
				break
			}

			case Kind.FRAGMENT_SPREAD: {
				const fragmentName = selection.name.value
				if (
					visitedFragmentNames.has(fragmentName)
					|| !shouldIncludeNode(selection, variableValues)
				) {
					continue
				}
				visitedFragmentNames.add(fragmentName)

				const fragment = getOwn(fragments, fragmentName)
				if (!fragment || !doesFragmentConditionMatch(schema, fragment, runtimeTypeName)) {
					continue
				}

				collectFieldsImpl(
					schema,
					fragments,
					variableValues,
					runtimeTypeName,
					fragment.selectionSet,
					groupedFieldSet,
					visitedFragmentNames,
				)
				break
			}
		}
	}
}

/**
 * Get possible types from an abstract type
 */
function getPossibleTypes(type: InterfaceType | UnionType): string[] {
	// InterfaceType: [kind, fields, interfaces, possibleTypes, description?]
	// UnionType: [kind, possibleTypes, description?]
	if (type[0] === TypeKind.INTERFACE) {
		return type[3]
	}
	return type[1]
}

/**
 * Get the response key for a field (alias or field name)
 */
function getFieldResponseKey(field: FieldNode): string {
	return field.alias?.value ?? field.name.value
}

/**
 * Check @skip and @include directives
 */
function shouldIncludeNode(
	node: FieldNode | InlineFragmentNode | FragmentSpreadNode,
	variableValues: Record<string, unknown>,
): boolean {
	const skip = getDirectiveValues('skip', node, variableValues)
	if (skip?.if === true) {
		return false
	}

	const include = getDirectiveValues('include', node, variableValues)
	if (include?.if === false) {
		return false
	}

	return true
}

/**
 * Check if fragment type condition matches runtime type
 */
function doesFragmentConditionMatch(
	schema: Schema,
	fragment: InlineFragmentNode | FragmentDefinitionNode,
	runtimeTypeName: string,
): boolean {
	const typeCondition = fragment.typeCondition
	if (!typeCondition) {
		return true
	}

	const conditionalTypeName = typeCondition.name.value
	if (conditionalTypeName === runtimeTypeName) {
		return true
	}

	const conditionalType = getOwn(schema.t, conditionalTypeName)
	if (!conditionalType) {
		return false
	}

	// Check if conditional type is abstract and runtime type is possible type
	if (isAbstractType(conditionalType)) {
		return getPossibleTypes(conditionalType).includes(runtimeTypeName)
	}

	// Check if runtime type implements conditional interface
	const runtimeType = getOwn(schema.t, runtimeTypeName)
	if (runtimeType && isObjectType(runtimeType)) {
		// ObjectType: [kind, fields, interfaces, description?]
		return runtimeType[2].includes(conditionalTypeName)
	}

	return false
}

/**
 * Collect subfields for a return type
 */
export function collectSubfields(
	schema: Schema,
	fragments: Record<string, FragmentDefinitionNode>,
	variableValues: Record<string, unknown>,
	runtimeTypeName: string,
	fieldNodes: readonly FieldNode[],
): GroupedFieldSet {
	const groupedFieldSet = new Map<string, FieldNode[]>()
	const visitedFragmentNames = new Set<string>()

	for (const fieldNode of fieldNodes) {
		if (fieldNode.selectionSet) {
			collectFieldsImpl(
				schema,
				fragments,
				variableValues,
				runtimeTypeName,
				fieldNode.selectionSet,
				groupedFieldSet,
				visitedFragmentNames,
			)
		}
	}

	return groupedFieldSet
}
