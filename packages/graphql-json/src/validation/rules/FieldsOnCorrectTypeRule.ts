/**
 * Fields on correct type
 *
 * A GraphQL document is only valid if all fields selected are defined by the
 * parent type, or are an allowed meta field such as __typename.
 *
 * See https://spec.graphql.org/draft/#sec-Field-Selections
 */
import type { ASTVisitor, FieldNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { Schema, Type } from '../../types/schema.js'
import { isAbstractType, isInterfaceType, isObjectType, T } from '../../types/schema.js'
import type { ValidationContext } from '../ValidationContext.js'
import { getOwn } from '../../utils/helpers.js'
import { didYouMean, naturalCompare, suggestionList } from '../helpers.js'

export function FieldsOnCorrectTypeRule(context: ValidationContext): ASTVisitor {
	return {
		Field(node: FieldNode) {
			const type = context.getParentType()
			if (type) {
				const fieldDef = context.getFieldDef()
				if (!fieldDef) {
					// This field doesn't exist, lets look for suggestions.
					const schema = context.getSchema()
					const fieldName = node.name.value
					const typeName = context.getParentTypeName() ?? '(unknown)'

					// First determine if there are any suggested types to condition on.
					let suggestion = didYouMean('to use an inline fragment on', getSuggestedTypeNames(schema, type, fieldName))

					// If there are no suggested types, then perhaps this was a typo?
					if (suggestion === '') {
						suggestion = didYouMean(getSuggestedFieldNames(type, fieldName))
					}

					// Report an error, including helpful suggestions.
					context.reportError(
						new GraphQLError(
							`Cannot query field "${fieldName}" on type "${typeName}".${suggestion}`,
							{ nodes: node },
						),
					)
				}
			}
		},
	}
}

/**
 * Go through all of the implementations of type, as well as the interfaces that
 * they implement. If any of those types include the provided field, suggest them,
 * sorted by how often the type is referenced.
 */
function getSuggestedTypeNames(schema: Schema, type: Type, fieldName: string): string[] {
	if (!isAbstractType(type)) {
		// Must be an Object type, which does not have possible fields.
		return []
	}

	const suggestedTypes = new Set<string>()
	const usageCount = new Map<string, number>()

	for (const possibleTypeName of T.possibleTypes(type)) {
		const possibleType = getOwn(schema.t, possibleTypeName)
		// graphql-js possible types are the object types only
		if (!possibleType || !isObjectType(possibleType) || !getOwn(possibleType[1], fieldName)) {
			continue
		}

		// This object type defines this field.
		suggestedTypes.add(possibleTypeName)
		usageCount.set(possibleTypeName, 1)

		for (const interfaceName of possibleType[2]) {
			const possibleInterface = getOwn(schema.t, interfaceName)
			if (!possibleInterface || !isInterfaceType(possibleInterface) || !getOwn(possibleInterface[1], fieldName)) {
				continue
			}

			// This interface type defines this field.
			suggestedTypes.add(interfaceName)
			usageCount.set(interfaceName, (usageCount.get(interfaceName) ?? 0) + 1)
		}
	}

	return [...suggestedTypes].sort((typeA, typeB) => {
		// Suggest both interface and object types based on how common they are.
		const usageCountDiff = (usageCount.get(typeB) ?? 0) - (usageCount.get(typeA) ?? 0)
		if (usageCountDiff !== 0) {
			return usageCountDiff
		}

		// Suggest super types first followed by subtypes
		if (isSuperInterface(schema, typeA, typeB)) {
			return -1
		}
		if (isSuperInterface(schema, typeB, typeA)) {
			return 1
		}

		return naturalCompare(typeA, typeB)
	})
}

/**
 * Whether `superType` is an interface that `subType` implements (graphql-js `isSubType` of an interface)
 */
function isSuperInterface(schema: Schema, superType: string, subType: string): boolean {
	const superTypeDef = getOwn(schema.t, superType)
	const subTypeDef = getOwn(schema.t, subType)
	return superTypeDef !== undefined && isInterfaceType(superTypeDef) && subTypeDef !== undefined
		&& (isObjectType(subTypeDef) || isInterfaceType(subTypeDef)) && subTypeDef[2].includes(superType)
}

/**
 * For the field name provided, determine if there are any similar field names
 * that may be the result of a typo.
 */
function getSuggestedFieldNames(type: Type, fieldName: string): string[] {
	if (isObjectType(type) || isInterfaceType(type)) {
		return suggestionList(fieldName, Object.keys(type[1]))
	}
	// Otherwise, must be a Union type, which does not define fields.
	return []
}
