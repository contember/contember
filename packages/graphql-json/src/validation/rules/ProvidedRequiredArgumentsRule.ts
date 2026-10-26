/**
 * Provided required arguments
 *
 * A field or directive is only valid if all required (non-null without a
 * default value) field arguments have been provided.
 *
 * See https://spec.graphql.org/draft/#sec-Required-Arguments
 */
import type { ASTVisitor, FieldNode } from 'graphql'
import { GraphQLError } from 'graphql'

import { A } from '../../types/schema.js'
import { formatTypeRef, isNonNullType } from '../../utils/typeRef.js'
import type { ValidationContext } from '../ValidationContext.js'

export function ProvidedRequiredArgumentsRule(context: ValidationContext): ASTVisitor {
	return {
		Field: {
			leave(fieldNode: FieldNode) {
				const fieldDef = context.getFieldDef()
				if (!fieldDef) {
					return
				}

				const providedArgs = new Set(
					fieldNode.arguments?.map((arg) => arg.name.value) ?? [],
				)

				// Field: [typeRef, args, description?, deprecationReason?]
				const args = fieldDef[1]
				if (!args) {
					return
				}

				for (const [argName, argDef] of Object.entries(args)) {
					// Argument: [typeRef, defaultValue?, description?]
					const argTypeRef = A.type(argDef)
					const argDefaultValue = A.defaultValue(argDef)
					// Check if argument is required (non-null without default value)
					if (
						isNonNullType(argTypeRef[0])
						&& argDefaultValue === undefined
						&& !providedArgs.has(argName)
					) {
						const parentTypeName = context.getParentTypeName()
						const fieldName = fieldNode.name.value
						context.reportError(
							new GraphQLError(
								`Field "${parentTypeName}.${fieldName}" argument "${argName}" of type "${formatTypeRef(argTypeRef)}" is required, but it was not provided.`,
								{ nodes: fieldNode },
							),
						)
					}
				}
			},
		},
	}
}
