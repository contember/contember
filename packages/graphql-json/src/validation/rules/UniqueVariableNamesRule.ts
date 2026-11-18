/**
 * Unique variable names
 *
 * A GraphQL operation is only valid if all its variables are uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Variable-Uniqueness
 */
import type { ASTVisitor, NameNode, OperationDefinitionNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function UniqueVariableNamesRule(context: ValidationContext): ASTVisitor {
	return {
		OperationDefinition(operationNode: OperationDefinitionNode) {
			const seenVariableNames = new Map<string, NameNode[]>()
			for (const varDef of operationNode.variableDefinitions ?? []) {
				const name = varDef.variable.name
				const names = seenVariableNames.get(name.value)
				if (names) {
					names.push(name)
				} else {
					seenVariableNames.set(name.value, [name])
				}
			}

			for (const [variableName, names] of seenVariableNames) {
				if (names.length > 1) {
					context.reportError(new GraphQLError(`There can be only one variable named "$${variableName}".`, { nodes: names }))
				}
			}

			return false // Don't visit deeper
		},
	}
}
