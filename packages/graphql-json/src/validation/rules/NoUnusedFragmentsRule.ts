/**
 * No unused fragments
 *
 * A GraphQL document is only valid if all fragment definitions are spread
 * within operations, or spread within other fragments spread within operations.
 *
 * See https://spec.graphql.org/draft/#sec-Fragments-Must-Be-Used
 */
import type { ASTVisitor, FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function NoUnusedFragmentsRule(context: ValidationContext): ASTVisitor {
	const operationDefs: OperationDefinitionNode[] = []
	const fragmentDefs: FragmentDefinitionNode[] = []

	return {
		OperationDefinition(node) {
			operationDefs.push(node)
			return false // Don't visit deeper
		},
		FragmentDefinition(node) {
			fragmentDefs.push(node)
			return false // Don't visit deeper
		},
		Document: {
			leave() {
				const fragmentNameUsed = new Set<string>()
				for (const operation of operationDefs) {
					for (const fragment of context.getRecursivelyReferencedFragments(operation)) {
						fragmentNameUsed.add(fragment.name.value)
					}
				}

				for (const fragmentDef of fragmentDefs) {
					const fragName = fragmentDef.name.value
					if (!fragmentNameUsed.has(fragName)) {
						context.reportError(
							new GraphQLError(`Fragment "${fragName}" is never used.`, {
								nodes: fragmentDef,
							}),
						)
					}
				}
			},
		},
	}
}
