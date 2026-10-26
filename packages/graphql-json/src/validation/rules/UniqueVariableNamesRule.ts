/**
 * Unique variable names
 *
 * A GraphQL operation is only valid if all its variables are uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Variable-Uniqueness
 */
import type { ASTVisitor, OperationDefinitionNode, VariableDefinitionNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function UniqueVariableNamesRule(context: ValidationContext): ASTVisitor {
	return {
		OperationDefinition(operationNode: OperationDefinitionNode) {
			const seenVariableDefinitions = new Map<string, VariableDefinitionNode>()

			for (const varDef of operationNode.variableDefinitions ?? []) {
				const variableName = varDef.variable.name.value
				const firstSeenDef = seenVariableDefinitions.get(variableName)

				if (firstSeenDef) {
					context.reportError(
						new GraphQLError(
							`There can be only one variable named "$${variableName}".`,
							{ nodes: [firstSeenDef.variable, varDef.variable] },
						),
					)
				} else {
					seenVariableDefinitions.set(variableName, varDef)
				}
			}

			return false // Don't visit deeper
		},
	}
}
