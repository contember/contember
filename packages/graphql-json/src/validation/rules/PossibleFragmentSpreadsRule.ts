/**
 * Possible fragment spreads
 *
 * A fragment spread is only valid if the type condition could ever possibly
 * be true: if there is a non-empty intersection of the possible parent types,
 * and possible types which pass the type condition.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-spread-is-possible
 */
import type { ASTVisitor, FragmentSpreadNode, InlineFragmentNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { Schema, Type } from '../../types/schema.js'
import { isAbstractType, isCompositeType, isObjectType, T } from '../../types/schema.js'
import { getNamedType } from '../../utils/typeRef.js'
import type { ValidationContext } from '../ValidationContext.js'
import { findTypeName } from '../../utils/findTypeName.js'

export function PossibleFragmentSpreadsRule(context: ValidationContext): ASTVisitor {
	return {
		InlineFragment(node: InlineFragmentNode) {
			const fragType = context.getType()
			const parentType = context.getParentType()

			if (fragType && parentType) {
				const schema = context.getSchema()
				const fragTypeName = getNamedType(fragType)
				const fragTypeObj = schema.t[fragTypeName]
				const parentTypeName = findTypeName(schema, parentType) ?? '(unknown)'

				if (
					fragTypeObj
					&& isCompositeType(fragTypeObj)
					&& isCompositeType(parentType)
					&& !doTypesOverlap(schema, fragTypeObj, fragTypeName, parentType, parentTypeName)
				) {
					context.reportError(
						new GraphQLError(
							`Fragment cannot be spread here as objects of type "${parentTypeName}" can never be of type "${fragTypeName}".`,
							{ nodes: node },
						),
					)
				}
			}
		},

		FragmentSpread(node: FragmentSpreadNode) {
			const fragName = node.name.value
			const fragDef = context.getFragment(fragName)
			const parentType = context.getParentType()

			if (fragDef && parentType) {
				const schema = context.getSchema()
				const fragTypeName = fragDef.typeCondition.name.value
				const fragType = schema.t[fragTypeName]
				const parentTypeName = findTypeName(schema, parentType) ?? '(unknown)'

				if (
					fragType
					&& isCompositeType(fragType)
					&& isCompositeType(parentType)
					&& !doTypesOverlap(schema, fragType, fragTypeName, parentType, parentTypeName)
				) {
					context.reportError(
						new GraphQLError(
							`Fragment "${fragName}" cannot be spread here as objects of type "${parentTypeName}" can never be of type "${fragTypeName}".`,
							{ nodes: node },
						),
					)
				}
			}
		},
	}
}

/**
 * Determines if two composite types "overlap". Two composite types overlap
 * when the Sets of possible concrete types for each intersect.
 */
function doTypesOverlap(
	_schema: Schema,
	typeA: Type,
	typeAName: string,
	typeB: Type,
	typeBName: string,
): boolean {
	// Identical types always overlap
	if (typeA === typeB || typeAName === typeBName) {
		return true
	}

	const possibleTypesA = getPossibleTypes(typeA, typeAName)
	const possibleTypesB = getPossibleTypes(typeB, typeBName)

	// Check if there's any intersection
	for (const type of possibleTypesA) {
		if (possibleTypesB.has(type)) {
			return true
		}
	}

	return false
}

/**
 * Get the set of possible concrete (Object) types for a composite type.
 */
function getPossibleTypes(type: Type, typeName: string): Set<string> {
	if (isObjectType(type)) {
		return new Set([typeName])
	}

	if (isAbstractType(type)) {
		return new Set(T.possibleTypes(type))
	}

	return new Set()
}
