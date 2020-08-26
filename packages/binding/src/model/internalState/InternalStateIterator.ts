import { assertNever } from '../../utils'
import { InternalEntityListState } from './InternalEntityListState'
import { InternalEntityState } from './InternalEntityState'
import { InternalStateType } from './InternalStateType'

export class InternalStateIterator {
	public static *depthFirstINodes(
		store: Map<string, InternalEntityState>,
		root: InternalEntityState | InternalEntityListState,
		match: (iNode: InternalEntityState | InternalEntityListState) => boolean,
	): Generator<InternalEntityState | InternalEntityListState, void> {
		yield* this.depthFirstINodesImplementation(store, root, match, new Set())
	}

	private static *depthFirstINodesImplementation(
		store: Map<string, InternalEntityState>,
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
					yield* this.depthFirstINodesImplementation(store, childState, match, visitedINodes)
				}
			}
		} else if (root.type === InternalStateType.EntityList) {
			for (const childKey of root.childrenKeys) {
				const child = store.get(childKey)
				if (child === undefined) {
					continue
				}
				yield* this.depthFirstINodesImplementation(store, child, match, visitedINodes)
			}
		} else {
			return assertNever(root)
		}
		if (match(root)) {
			yield root
		}
	}
}
