import { PlaceholderName } from '../../treeParameters'
import { assertNever } from '../../utils'
import { TreeStore } from '../TreeStore'
import { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'
import { getEntityMarker } from './getEntityMarker'
import { RootStateNode, StateINode, StateNode } from './StateNode'
import { StateType } from './StateType'

export class StateIterator {
	// Note that this only yields siblings with the same placeholderName!
	public static *eachSiblingRealmChild<S extends StateNode>(state: S & StateNode): Generator<S, void> {
		let closestEntityRealm: EntityRealmState
		let placeholderName: PlaceholderName

		switch (state.type) {
			case StateType.Field: {
				closestEntityRealm = state.parent
				placeholderName = state.placeholderName
				break
			}
			case StateType.EntityRealm: {
				// TODO this is probably wrong
				closestEntityRealm = state
				placeholderName = getEntityMarker(state).placeholderName
				break
			}
			case StateType.EntityList: {
				const candidate = state.blueprint.parent
				if (candidate === undefined) {
					yield state
					return
				}
				closestEntityRealm = candidate
				placeholderName = state.blueprint.marker.placeholderName
				break
			}
			default:
				assertNever(state)
		}
		for (let [realmKey, realm] of closestEntityRealm.entity.realms) {
			if (realm.type === StateType.EntityRealmStub) {
				const marker = getEntityMarker(realm)
				if (marker.fields.placeholders.has(placeholderName)) {
					realm.getAccessor()
					realm = closestEntityRealm.entity.realms.get(realmKey) as EntityRealmState
				} else {
					// This realm is irrelevant. No need to force-initialize it.
					continue
				}
			}
			const child = realm.children.get(placeholderName)
			if (child === undefined) {
				continue
			}
			if (child.type === state.type) {
				yield child as S
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

	public static *eachRootState(treeStore: TreeStore): Generator<[PlaceholderName, RootStateNode], void, undefined> {
		for (const rootStates of treeStore.subTreeStatesByRoot.values()) {
			yield* rootStates.entries()
		}
	}
}
