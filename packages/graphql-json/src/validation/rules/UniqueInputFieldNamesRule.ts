/**
 * Unique input field names
 *
 * A GraphQL input object value is only valid if all supplied fields are
 * uniquely named.
 *
 * See https://spec.graphql.org/draft/#sec-Input-Object-Field-Uniqueness
 */
import type { ASTVisitor, NameNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function UniqueInputFieldNamesRule(context: ValidationContext): ASTVisitor {
	const knownNameStack: Array<Map<string, NameNode>> = []
	let knownNames = new Map<string, NameNode>()

	return {
		ObjectValue: {
			enter() {
				knownNameStack.push(knownNames)
				knownNames = new Map()
			},
			leave() {
				const prevKnownNames = knownNameStack.pop()
				if (prevKnownNames) {
					knownNames = prevKnownNames
				}
			},
		},
		ObjectField(node) {
			const fieldName = node.name.value
			const knownField = knownNames.get(fieldName)
			if (knownField) {
				context.reportError(
					new GraphQLError(
						`There can be only one input field named "${fieldName}".`,
						{ nodes: [knownField, node.name] },
					),
				)
			} else {
				knownNames.set(fieldName, node.name)
			}
		},
	}
}
