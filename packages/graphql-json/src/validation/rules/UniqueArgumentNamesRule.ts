/**
 * Unique argument names
 *
 * A GraphQL field or directive is only valid if all supplied arguments are
 * uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Argument-Uniqueness
 */
import type { ArgumentNode, ASTVisitor, NameNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function UniqueArgumentNamesRule(context: ValidationContext): ASTVisitor {
	return {
		Field(node) {
			checkArgUniqueness(context, node.arguments ?? [])
		},
		Directive(node) {
			checkArgUniqueness(context, node.arguments ?? [])
		},
	}
}

function checkArgUniqueness(
	context: ValidationContext,
	args: readonly ArgumentNode[],
): void {
	const seenArgs = new Map<string, NameNode>()

	for (const arg of args) {
		const argName = arg.name.value
		const seenArg = seenArgs.get(argName)
		if (seenArg) {
			context.reportError(
				new GraphQLError(
					`There can be only one argument named "${argName}".`,
					{ nodes: [seenArg, arg.name] },
				),
			)
		} else {
			seenArgs.set(argName, arg.name)
		}
	}
}
