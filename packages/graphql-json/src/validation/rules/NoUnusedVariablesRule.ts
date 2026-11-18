/**
 * No unused variables
 *
 * A GraphQL operation is only valid if all variables defined by an operation
 * are used, either directly or within a spread fragment.
 *
 * See https://spec.graphql.org/draft/#sec-All-Variables-Used
 */
import type { ASTVisitor, VariableDefinitionNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function NoUnusedVariablesRule(context: ValidationContext): ASTVisitor {
	let variableDefs: VariableDefinitionNode[] = []

	return {
		OperationDefinition: {
			enter() {
				variableDefs = []
			},
			leave(operation) {
				const variableNameUsed = new Set<string>()
				const usages = context.getRecursiveVariableUsages(operation)

				for (const { node } of usages) {
					variableNameUsed.add(node.name.value)
				}

				for (const variableDef of variableDefs) {
					const variableName = variableDef.variable.name.value
					if (!variableNameUsed.has(variableName)) {
						context.reportError(
							new GraphQLError(
								operation.name
									? `Variable "$${variableName}" is never used in operation "${operation.name.value}".`
									: `Variable "$${variableName}" is never used.`,
								{ nodes: variableDef },
							),
						)
					}
				}
			},
		},
		VariableDefinition(def) {
			variableDefs.push(def)
		},
	}
}
