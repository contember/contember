/**
 * Max introspection depth
 *
 * Rejects introspection queries nesting the list fields of "__Type" three or more levels deep,
 * which would let a small query produce an enormous response.
 *
 * Part of graphql-js 16 `specifiedRules` (as a recommended rule).
 */
import type { ASTVisitor, FieldNode, FragmentDefinitionNode, FragmentSpreadNode, InlineFragmentNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

const MAX_LISTS_DEPTH = 3

export function MaxIntrospectionDepthRule(context: ValidationContext): ASTVisitor {
	/**
	 * Counts the depth of list fields in "__Type" recursively and returns `true` if the limit has been reached.
	 */
	function checkDepth(
		node: FieldNode | FragmentSpreadNode | InlineFragmentNode | FragmentDefinitionNode,
		visitedFragments: Set<string> = new Set(),
		depth = 0,
	): boolean {
		if (node.kind === Kind.FRAGMENT_SPREAD) {
			const fragmentName = node.name.value
			if (visitedFragments.has(fragmentName)) {
				// Fragment cycles are handled by `NoFragmentCyclesRule`.
				return false
			}
			const fragment = context.getFragment(fragmentName)
			if (!fragment) {
				// Missing fragments checks are handled by `KnownFragmentNamesRule`.
				return false
			}

			// Visiting a fragment twice is fine, as long as one visit is not inside the other.
			try {
				visitedFragments.add(fragmentName)
				return checkDepth(fragment, visitedFragments, depth)
			} finally {
				visitedFragments.delete(fragmentName)
			}
		}

		if (
			node.kind === Kind.FIELD
			// check all introspection lists
			&& (node.name.value === 'fields'
				|| node.name.value === 'interfaces'
				|| node.name.value === 'possibleTypes'
				|| node.name.value === 'inputFields')
		) {
			depth++
			if (depth >= MAX_LISTS_DEPTH) {
				return true
			}
		}

		// handles fields and inline fragments
		if (node.selectionSet) {
			for (const child of node.selectionSet.selections) {
				if (checkDepth(child, visitedFragments, depth)) {
					return true
				}
			}
		}

		return false
	}

	return {
		Field(node) {
			if (node.name.value === '__schema' || node.name.value === '__type') {
				if (checkDepth(node)) {
					context.reportError(new GraphQLError('Maximum introspection depth exceeded', { nodes: [node] }))
					return false
				}
			}
			return undefined
		},
	}
}
