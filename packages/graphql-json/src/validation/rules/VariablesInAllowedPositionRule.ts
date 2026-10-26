/**
 * Variables in allowed position
 *
 * Variable usages must be compatible with the arguments they are passed to.
 *
 * See https://spec.graphql.org/draft/#sec-All-Variable-Usages-are-Allowed
 */
import type { ASTVisitor, OperationDefinitionNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { TypeRef } from '../../types/schema.js'
import { formatTypeRef, isNonNullType, unwrapNonNull } from '../../utils/typeRef.js'
import { isTypeSubTypeOf } from '../helpers.js'
import { typeFromAST } from '../typeFromAST.js'
import type { ValidationContext } from '../ValidationContext.js'

export function VariablesInAllowedPositionRule(context: ValidationContext): ASTVisitor {
	return {
		OperationDefinition: {
			leave(operation: OperationDefinitionNode) {
				const varDefMap = new Map<string, TypeRef>()

				for (const varDef of operation.variableDefinitions ?? []) {
					varDefMap.set(varDef.variable.name.value, typeFromAST(varDef.type))
				}

				const usages = context.getRecursiveVariableUsages(operation)
				for (const { node, type: locationType, defaultValue } of usages) {
					const varName = node.name.value
					const varType = varDefMap.get(varName)

					if (varType && locationType) {
						// A variable can be used if the variable type is a subtype of the location type.
						// However, if the location has a default value, the variable type doesn't need
						// to be non-null.
						const schema = context.getSchema()

						// Get the variable definition to check for default value
						const varDef = operation.variableDefinitions?.find(
							(v) => v.variable.name.value === varName,
						)
						const hasVarDefault = varDef?.defaultValue !== undefined

						// Effective type considers default values
						let effectiveVarType = varType
						if (hasVarDefault && !isNonNullType(varType[0])) {
							// If variable has default, treat it as non-null for compatibility
							// Pattern 1 = T! (NonNull<Named>)
							effectiveVarType = [1, varType[1]]
						}

						let effectiveLocationType = locationType
						if (defaultValue !== undefined && isNonNullType(locationType[0])) {
							// If location has default, the non-null requirement is relaxed
							effectiveLocationType = [unwrapNonNull(locationType[0]), locationType[1]]
						}

						if (!isTypeSubTypeOf(schema, effectiveVarType, effectiveLocationType)) {
							context.reportError(
								new GraphQLError(
									`Variable "$${varName}" of type "${formatTypeRef(varType)}" used in position expecting type "${formatTypeRef(locationType)}".`,
									{ nodes: [node] },
								),
							)
						}
					}
				}
			},
		},
	}
}
