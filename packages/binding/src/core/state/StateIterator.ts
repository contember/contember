import { PlaceholderName } from '../../treeParameters/primitives'
import { assertNever } from '../../utils'
import { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'
import { StateINode, StateNode } from './StateNode'
import { StateType } from './StateType'

export class StateIterator {
	public static *eachSiblingRealmChild<T extends StateType>(
		parent: EntityRealmState,
		type: T,
		placeholderName: PlaceholderName,
	): Generator<StateNode & { type: T }, void> {
		for (let [realmKey, realm] of parent.entity.realms) {
			if (realm.type === StateType.EntityRealmStub) {
				if (realm.blueprint.markersContainer.placeholders.has(placeholderName)) {
					realm.getAccessor()
					realm = parent.entity.realms.get(realmKey) as EntityRealmState
				} else {
					// This realm is irrelevant. No need to force-initialize it.
					continue
				}
			}
			const child = realm.children.get(placeholderName)
			if (child === undefined) {
				continue
			}
			if (child.type === type) {
				yield child as StateNode & { type: T }
			}
		}
	}

	public static *depthFirstINodes(
		root: StateINode,
		match: (iNode: StateINode) => boolean,
	): Generator<StateINode, void> {
		yield* this.depthFirstINodesImplementation(root, match, new Set())
	}

	private static *depthFirstINodesImplementation(
		root: StateINode | EntityRealmStateStub,
		match: (iNode: StateINode) => boolean,
		visitedINodes: Set<StateINode>,
	): Generator<StateINode, void> {
		// Ignore uninitialized. Is that always correct though? This should probably be configurable.
		if (root.type === StateType.EntityRealmStub || visitedINodes.has(root)) {
			return
		}
		visitedINodes.add(root)
		switch (root.type) {
			case StateType.EntityRealm:
				for (const [, childState] of root.children) {
					if (childState.type === StateType.EntityRealm || childState.type === StateType.EntityList) {
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
