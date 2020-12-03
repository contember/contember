import { assertNever } from '../../utils'
import { EntityStateStub } from './EntityStateStub'
import { StateINode } from './StateNode'
import { StateType } from './StateType'

export class StateIterator {
	public static *depthFirstINodes(
		root: StateINode,
		match: (iNode: StateINode) => boolean,
	): Generator<StateINode, void> {
		yield* this.depthFirstINodesImplementation(root, match, new Set())
	}

	private static *depthFirstINodesImplementation(
		root: StateINode | EntityStateStub,
		match: (iNode: StateINode) => boolean,
		visitedINodes: Set<StateINode>,
	): Generator<StateINode, void> {
		// Ignore uninitialized. Is that always correct though? This should probably be configurable.
		if (root.type === StateType.EntityStub || visitedINodes.has(root)) {
			return
		}
		visitedINodes.add(root)
		switch (root.type) {
			case StateType.Entity:
				for (const [, childState] of root.children) {
					if (childState.type === StateType.Entity || childState.type === StateType.EntityList) {
						yield* this.depthFirstINodesImplementation(childState, match, visitedINodes)
					}
				}
				break
			case StateType.EntityList:
				for (const [, childState] of root.children) {
					yield* this.depthFirstINodesImplementation(childState, match, visitedINodes)
				}
				break
			default:
				return assertNever(root)
		}
		if (match(root)) {
			yield root
		}
	}
}
