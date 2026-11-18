/**
 * Unique operation names
 *
 * A GraphQL document is only valid if all defined operations have unique names.
 *
 * See https://spec.graphql.org/draft/#sec-Operation-Name-Uniqueness
 */
import type { ASTVisitor, NameNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function UniqueOperationNamesRule(context: ValidationContext): ASTVisitor {
	const knownOperationNames = new Map<string, NameNode>()

	return {
		OperationDefinition(node) {
			const operationName = node.name
			if (operationName) {
				const knownName = knownOperationNames.get(operationName.value)
				if (knownName) {
					context.reportError(
						new GraphQLError(
							`There can be only one operation named "${operationName.value}".`,
							{ nodes: [knownName, operationName] },
						),
					)
				} else {
					knownOperationNames.set(operationName.value, operationName)
				}
			}
			return false
		},
		FragmentDefinition() {
			return false
		},
	}
}
