/**
 * Variables in allowed position
 *
 * Variable usages must be compatible with the arguments they are passed to.
 *
 * See https://spec.graphql.org/draft/#sec-All-Variable-Usages-are-Allowed
 */
import type { ASTVisitor, OperationDefinitionNode, ValueNode, VariableDefinitionNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import type { Schema, TypeRef } from '../../types/schema.js'
import { isInputObjectType } from '../../types/schema.js'
import { formatTypeRef, isNonNullType, unwrapNonNull } from '../../utils/typeRef.js'
import { isTypeSubTypeOf } from '../helpers.js'
import { typeFromAST } from '../typeFromAST.js'
import type { ValidationContext } from '../ValidationContext.js'

export function VariablesInAllowedPositionRule(context: ValidationContext): ASTVisitor {
	let varDefMap = new Map<string, VariableDefinitionNode>()

	return {
		OperationDefinition: {
			enter() {
				varDefMap = new Map()
			},

			leave(operation: OperationDefinitionNode) {
				const schema = context.getSchema()
				const usages = context.getRecursiveVariableUsages(operation)

				for (const { node, type, defaultValue, parentType } of usages) {
					const varName = node.name.value
					const varDef = varDefMap.get(varName)

					if (varDef && type) {
						// A var type is allowed if it is the same or more strict (e.g. is a subtype of) than the expected type.
						// It can be more strict if the variable type is non-null when the expected type is nullable.
						// If both are list types, the variable item type can be more strict than the expected item type (contravariant).
						const varType = typeFromAST(varDef.type)
						// an unknown variable type is reported by KnownTypeNamesRule
						const isKnownVarType = schema.t[varType[1]] !== undefined

						if (isKnownVarType && !allowedVariableUsage(schema, varType, varDef.defaultValue, type, defaultValue)) {
							context.reportError(
								new GraphQLError(
									`Variable "$${varName}" of type "${formatTypeRef(varType)}" used in position expecting type "${formatTypeRef(type)}".`,
									{ nodes: [varDef, node] },
								),
							)
						}

						const parentInputType = parentType ? schema.t[parentType[1]] : undefined
						if (parentType && parentInputType && isInputObjectType(parentInputType) && parentInputType[2] && !isNonNullType(varType[0])) {
							context.reportError(
								new GraphQLError(
									`Variable "$${varName}" is of type "${formatTypeRef(varType)}" but must be non-nullable to be used for OneOf Input Object "${
										parentType[1]
									}".`,
									{ nodes: [varDef, node] },
								),
							)
						}
					}
				}
			},
		},

		VariableDefinition(node) {
			varDefMap.set(node.variable.name.value, node)
		},
	}
}

/**
 * Returns true if the variable is allowed in the location it was found, which includes considering if default values
 * exist for either the variable or the location at which it is located.
 */
function allowedVariableUsage(
	schema: Schema,
	varType: TypeRef,
	varDefaultValue: ValueNode | undefined,
	locationType: TypeRef,
	locationDefaultValue: unknown,
): boolean {
	if (isNonNullType(locationType[0]) && !isNonNullType(varType[0])) {
		const hasNonNullVariableDefaultValue = varDefaultValue != null && varDefaultValue.kind !== Kind.NULL
		const hasLocationDefaultValue = locationDefaultValue !== undefined
		if (!hasNonNullVariableDefaultValue && !hasLocationDefaultValue) {
			return false
		}
		const nullableLocationType: TypeRef = [unwrapNonNull(locationType[0]), locationType[1]]
		return isTypeSubTypeOf(schema, varType, nullableLocationType)
	}
	return isTypeSubTypeOf(schema, varType, locationType)
}
