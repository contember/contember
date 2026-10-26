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
	if (args.length < 2) {
		return
	}
	const seenArgs = new Map<string, NameNode[]>()
	for (const arg of args) {
		const argNames = seenArgs.get(arg.name.value)
		if (argNames) {
			argNames.push(arg.name)
		} else {
			seenArgs.set(arg.name.value, [arg.name])
		}
	}

	for (const [argName, argNames] of seenArgs) {
		if (argNames.length > 1) {
			context.reportError(new GraphQLError(`There can be only one argument named "${argName}".`, { nodes: argNames }))
		}
	}
}
