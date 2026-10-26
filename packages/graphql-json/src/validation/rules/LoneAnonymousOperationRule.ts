/**
 * Lone anonymous operation
 *
 * A GraphQL document is only valid if when it contains an anonymous operation
 * (the query short-hand) that it contains only that one operation definition.
 *
 * See https://spec.graphql.org/draft/#sec-Lone-Anonymous-Operation
 */
import type { ASTVisitor } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function LoneAnonymousOperationRule(context: ValidationContext): ASTVisitor {
	let operationCount = 0

	return {
		Document(node) {
			operationCount = node.definitions.filter(
				(def) => def.kind === Kind.OPERATION_DEFINITION,
			).length
		},
		OperationDefinition(node) {
			if (!node.name && operationCount > 1) {
				context.reportError(
					new GraphQLError(
						'This anonymous operation must be the only defined operation.',
						{ nodes: node },
					),
				)
			}
		},
	}
}
