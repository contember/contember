import { assertNever } from '../../utils'
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
		root: StateINode,
		match: (iNode: StateINode) => boolean,
		visitedINodes: Set<StateINode>,
	): Generator<StateINode, void> {
		if (visitedINodes.has(root)) {
			return
		}
		visitedINodes.add(root)
		if (root.type === StateType.Entity) {
			for (const [, childState] of root.fields) {
				if (childState.type === StateType.Entity || childState.type === StateType.EntityList) {
					yield* this.depthFirstINodesImplementation(childState, match, visitedINodes)
				}
			}
		} else if (root.type === StateType.EntityList) {
			for (const childState of root.children) {
				yield* this.depthFirstINodesImplementation(childState, match, visitedINodes)
			}
		} else {
			return assertNever(root)
		}
		if (match(root)) {
			yield root
		}
	}
}
