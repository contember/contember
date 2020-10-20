import { assertNever } from '../../utils'
import { InternalEntityListState } from './InternalEntityListState'
import { InternalEntityState } from './InternalEntityState'
import { InternalStateType } from './InternalStateType'

export class InternalStateIterator {
	public static *depthFirstINodes(
		root: InternalEntityState | InternalEntityListState,
		match: (iNode: InternalEntityState | InternalEntityListState) => boolean,
	): Generator<InternalEntityState | InternalEntityListState, void> {
		yield* this.depthFirstINodesImplementation(root, match, new Set())
	}

	private static *depthFirstINodesImplementation(
		root: InternalEntityState | InternalEntityListState,
		match: (iNode: InternalEntityState | InternalEntityListState) => boolean,
		visitedINodes: Set<InternalEntityState | InternalEntityListState>,
	): Generator<InternalEntityState | InternalEntityListState, void> {
		if (visitedINodes.has(root)) {
			return
		}
		visitedINodes.add(root)
		if (root.type === InternalStateType.SingleEntity) {
			for (const [, childState] of root.fields) {
				if (childState.type === InternalStateType.SingleEntity || childState.type === InternalStateType.EntityList) {
					yield* this.depthFirstINodesImplementation(childState, match, visitedINodes)
				}
			}
		} else if (root.type === InternalStateType.EntityList) {
			for (const [, child] of root.children) {
				yield* this.depthFirstINodesImplementation(child, match, visitedINodes)
			}
		} else {
			return assertNever(root)
		}
		if (match(root)) {
			yield root
		}
	}
}
