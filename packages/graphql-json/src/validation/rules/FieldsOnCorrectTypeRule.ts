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
import { didYouMean, suggestionList } from '../helpers.js'

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
					let suggestion = getSuggestedTypeNames(schema, type, fieldName)

					// If there are no suggested types, then perhaps this was a typo?
					if (suggestion === '') {
						suggestion = getSuggestedFieldNames(type, fieldName)
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
 * they implement. If any of those types include the provided field, suggest them.
 */
function getSuggestedTypeNames(
	schema: Schema,
	type: Type,
	fieldName: string,
): string {
	if (!isAbstractType(type)) {
		// Must be an Object type, which does not have possible fields from other types.
		return ''
	}

	const suggestedTypes: string[] = []
	const possibleTypes = T.possibleTypes(type)

	for (const possibleTypeName of possibleTypes) {
		const possibleType = schema.t[possibleTypeName]
		if (possibleType && (isObjectType(possibleType) || isInterfaceType(possibleType))) {
			// ObjectType/InterfaceType: [kind, fields, ...]
			const fields = possibleType[1]
			if (fields[fieldName]) {
				suggestedTypes.push(possibleTypeName)
			}
		}
	}

	if (suggestedTypes.length > 0) {
		return didYouMean(suggestedTypes.map((t) => `"${t}"`)).replace(/"/g, '')
	}

	return ''
}

/**
 * For the field name provided, determine if there are any similar field names
 * that may be the result of a typo.
 */
function getSuggestedFieldNames(
	type: Type,
	fieldName: string,
): string {
	if (isObjectType(type) || isInterfaceType(type)) {
		// ObjectType/InterfaceType: [kind, fields, ...]
		const possibleFieldNames = Object.keys(type[1])
		const suggestions = suggestionList(fieldName, possibleFieldNames)
		return didYouMean(suggestions)
	}
	// Otherwise, must be a Union type, which does not define fields.
	return ''
}
