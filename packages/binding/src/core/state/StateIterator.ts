import type { FieldValue, PlaceholderName } from '../../treeParameters'
import { assertNever } from '../../utils'
import type { TreeStore } from '../TreeStore'
import type { EntityListState } from './EntityListState'
import type { EntityRealmState } from './EntityRealmState'
import type { FieldState } from './FieldState'
import { getEntityMarker } from './getEntityMarker'
import type { RootStateNode, StateINode, StateNode } from './StateNode'

export class StateIterator {
	public static *eachSiblingRealm(
		state: EntityRealmState,
		relevantPlaceholder?: PlaceholderName,
	): IterableIterator<EntityRealmState> {
		for (let [realmKey, realm] of state.entity.realms) {
			if (realm.type === 'entityRealmStub') {
				if (relevantPlaceholder === undefined || getEntityMarker(realm).fields.placeholders.has(relevantPlaceholder)) {
					realm.getAccessor()
					realm = state.entity.realms.get(realmKey) as EntityRealmState
				} else {
					// This realm is irrelevant. No need to force-initialize it.
					continue
				}
			}
			yield realm
		}
	}

	// Note that this only yields siblings with the same placeholderName!
	public static *eachSiblingRealmChild<Value extends FieldValue, S extends EntityListState | FieldState<Value>>(
		treeStore: TreeStore,
		state: S & StateNode<Value>,
	): IterableIterator<S> {
		if (state.type === 'entityList' && state.blueprint.parent === undefined) {
			// Top-level entity list
			for (const [, rootStates] of treeStore.subTreeStatesByRoot) {
				const rootList = rootStates.get(state.blueprint.marker.placeholderName)
				if (rootList?.type === 'entityList') {
					yield rootList as S
				}
			}
			return
		}

		let closestEntityRealm: EntityRealmState
		let placeholderName: PlaceholderName

		if (state.type === 'field') {
			closestEntityRealm = state.parent
			placeholderName = state.placeholderName
		} else if (state.type === 'entityList') {
			closestEntityRealm = state.blueprint.parent! // The parent-less case is handled above. Hence the assertion.
			placeholderName = state.blueprint.marker.placeholderName
		} else {
			return assertNever(state)
		}

		for (const realm of this.eachSiblingRealm(closestEntityRealm, placeholderName)) {
			const child = realm.children.get(placeholderName)
			if (child === undefined) {
				continue
			}
			if (child.type === state.type) {
				yield child as S
			}
		}
	}

	public static *depthFirstAllNodes(root: StateNode): IterableIterator<StateNode> {
		switch (root.type) {
			case 'entityRealm':
			case 'entityList':
				for (const childState of root.children.values()) {
					switch (childState.type) {
						case 'field':
						case 'entityRealm':
						case 'entityList':
							yield* this.depthFirstAllNodes(childState)
							break
						case 'entityRealmStub':
							break
						default:
							return assertNever(childState)
					}
				}
				break
			case 'field':
				break
			default:
				return assertNever(root)
		}
		yield root
	}

	public static *depthFirstINodes(
		root: StateINode,
		match?: (iNode: StateINode) => boolean,
	): IterableIterator<StateINode> {
		switch (root.type) {
			case 'entityRealm':
			case 'entityList':
				for (const childState of root.children.values()) {
					if (childState.type === 'entityRealm' || childState.type === 'entityList') {
						yield* this.depthFirstINodes(childState, match)
					}
				}
				break
			default:
				return assertNever(root)
		}
		if (match === undefined || match(root)) {
			yield root
		}
	}

	public static *eachRootState(treeStore: TreeStore): IterableIterator<[PlaceholderName, RootStateNode]> {
		for (const rootStates of treeStore.subTreeStatesByRoot.values()) {
			yield* rootStates.entries()
		}
	}
}
