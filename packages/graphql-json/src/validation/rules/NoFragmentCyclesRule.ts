/**
 * No fragment cycles
 *
 * The graph of fragment spreads must not form any cycles including spreading itself.
 * Otherwise an operation could infinitely spread or infinitely execute on cycles
 * in the underlying data.
 *
 * See https://spec.graphql.org/draft/#sec-Fragment-spreads-must-not-form-cycles
 */
import type { ASTVisitor, FragmentDefinitionNode, FragmentSpreadNode, SelectionSetNode } from 'graphql'
import { GraphQLError, Kind } from 'graphql'

import type { ValidationContext } from '../ValidationContext.js'

export function NoFragmentCyclesRule(context: ValidationContext): ASTVisitor {
	// Tracks already visited fragments to maintain O(N) complexity
	const visitedFrags = new Set<string>()

	// Array of AST nodes used to produce meaningful errors
	const spreadPath: FragmentSpreadNode[] = []

	// Position in the spread path
	const spreadPathIndexByName = new Map<string, number>()

	return {
		OperationDefinition() {
			return false
		},
		FragmentDefinition(node) {
			detectCycleRecursive(node)
			return false
		},
	}

	function detectCycleRecursive(fragment: FragmentDefinitionNode): void {
		if (visitedFrags.has(fragment.name.value)) {
			return
		}

		const fragmentName = fragment.name.value
		visitedFrags.add(fragmentName)

		const spreadNodes = getFragmentSpreads(fragment)
		if (spreadNodes.length === 0) {
			return
		}

		spreadPathIndexByName.set(fragmentName, spreadPath.length)

		for (const spreadNode of spreadNodes) {
			const spreadName = spreadNode.name.value
			const cycleIndex = spreadPathIndexByName.get(spreadName)

			spreadPath.push(spreadNode)
			if (cycleIndex === undefined) {
				const spreadFragment = context.getFragment(spreadName)
				if (spreadFragment) {
					detectCycleRecursive(spreadFragment)
				}
			} else {
				const cyclePath = spreadPath.slice(cycleIndex)
				const viaPath = cyclePath
					.slice(0, -1)
					.map((s) => `"${s.name.value}"`)
					.join(', ')

				context.reportError(
					new GraphQLError(
						`Cannot spread fragment "${spreadName}" within itself`
							+ (viaPath !== '' ? ` via ${viaPath}.` : '.'),
						{ nodes: cyclePath },
					),
				)
			}
			spreadPath.pop()
		}

		spreadPathIndexByName.delete(fragmentName)
	}

	function getFragmentSpreads(fragment: FragmentDefinitionNode): FragmentSpreadNode[] {
		const spreads: FragmentSpreadNode[] = []
		const setsToVisit: SelectionSetNode[] = [fragment.selectionSet]

		let set
		while ((set = setsToVisit.pop())) {
			for (const selection of set.selections) {
				if (selection.kind === Kind.FRAGMENT_SPREAD) {
					spreads.push(selection)
				} else if (selection.selectionSet) {
					setsToVisit.push(selection.selectionSet)
				}
			}
		}

		return spreads
	}
}
