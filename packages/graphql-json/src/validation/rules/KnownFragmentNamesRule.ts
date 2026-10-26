/**
 * Known fragment names
 *
 * A GraphQL document is only valid if all `...Fragment` fragment spreads refer
 * to fragments defined in the same document.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-spread-target-defined
 */
import type { ASTVisitor, FragmentSpreadNode } from 'graphql'
import { GraphQLError } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function KnownFragmentNamesRule(context: ValidationContext): ASTVisitor {
	return {
		FragmentSpread(node: FragmentSpreadNode) {
			const fragmentName = node.name.value
			const fragment = context.getFragment(fragmentName)
			if (!fragment) {
				context.reportError(
					new GraphQLError(`Unknown fragment "${fragmentName}".`, { nodes: node.name }),
				)
			}
		},
	}
}
