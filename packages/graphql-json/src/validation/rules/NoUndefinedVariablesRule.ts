/**
 * No undefined variables
 *
 * A GraphQL operation is only valid if all variables encountered, both directly
 * and via fragment spreads, are defined by that operation.
 *
 * See https://spec.graphql.org/draft/#sec-All-Variable-Uses-Defined
 */
import type { ASTVisitor, OperationDefinitionNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function NoUndefinedVariablesRule(context: ValidationContext): ASTVisitor {
	return {
		OperationDefinition: {
			leave(operation: OperationDefinitionNode) {
				const variableNameDefined = new Set(
					operation.variableDefinitions?.map((varDef) => varDef.variable.name.value) ?? [],
				)

				const usages = context.getRecursiveVariableUsages(operation)
				for (const { node } of usages) {
					const varName = node.name.value
					if (!variableNameDefined.has(varName)) {
						context.reportError(
							new GraphQLError(
								operation.name
									? `Variable "$${varName}" is not defined by operation "${operation.name.value}".`
									: `Variable "$${varName}" is not defined.`,
								{ nodes: [node, operation] },
							),
						)
					}
				}
			},
		},
	}
}
