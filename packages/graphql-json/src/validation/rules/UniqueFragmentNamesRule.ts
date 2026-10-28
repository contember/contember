/**
 * Unique fragment names
 *
 * A GraphQL document is only valid if all defined fragments have unique names.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-Name-Uniqueness
 */
import type { ASTVisitor, NameNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function UniqueFragmentNamesRule(context: ValidationContext): ASTVisitor {
	const knownFragmentNames = new Map<string, NameNode>()

	return {
		OperationDefinition() {
			return false
		},
		FragmentDefinition(node) {
			const fragmentName = node.name
			const knownName = knownFragmentNames.get(fragmentName.value)
			if (knownName) {
				context.reportError(
					new GraphQLError(
						`There can be only one fragment named "${fragmentName.value}".`,
						{ nodes: [knownName, fragmentName] },
					),
				)
			} else {
				knownFragmentNames.set(fragmentName.value, fragmentName)
			}
			return false
		},
	}
}
