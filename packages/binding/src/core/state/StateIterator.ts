import { FieldMarker, HasManyRelationMarker, HasOneRelationMarker } from '../../markers'
import type { PlaceholderName } from '../../treeParameters'
import { assertNever } from '../../utils'
import type { TreeStore } from '../TreeStore'
import type { EntityListState } from './EntityListState'
import type { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'
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
	public static *eachSiblingRealmChild<S extends EntityListState | FieldState>(
		treeStore: TreeStore,
		state: S & StateNode,
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

	public static *eachDistinctEntityFieldState(
		realm: EntityRealmState | EntityRealmStateStub,
	): IterableIterator<
		| { type: 'entityRealmStub'; marker: HasOneRelationMarker; fieldState: EntityRealmStateStub }
		| { type: 'entityRealm'; marker: HasOneRelationMarker; fieldState: EntityRealmState }
		| { type: 'field'; marker: FieldMarker; fieldState: FieldState }
		| { type: 'entityList'; marker: HasManyRelationMarker; fieldState: EntityListState }
	> {
		if (realm.type === 'entityRealmStub') {
			return
		}
		const visited: Set<PlaceholderName> = new Set()

		for (const siblingRealm of realm.entity.realms.values()) {
			if (siblingRealm.type === 'entityRealmStub') {
				continue
			}

			for (const [placeholderName, marker] of getEntityMarker(siblingRealm).fields.markers) {
				if (visited.has(placeholderName)) {
					continue
				}

				visited.add(placeholderName)

				const fieldState = siblingRealm.children.get(placeholderName)

				if (fieldState === undefined) {
					continue // This should never happen.
				}

				if (fieldState.type === 'field' && marker instanceof FieldMarker) {
					yield {
						type: 'field',
						marker,
						fieldState,
					}
				} else if (fieldState.type === 'entityRealm' && marker instanceof HasOneRelationMarker) {
					yield {
						type: 'entityRealm',
						marker,
						fieldState,
					}
				} else if (fieldState.type === 'entityRealmStub' && marker instanceof HasOneRelationMarker) {
					yield {
						type: 'entityRealmStub',
						marker,
						fieldState,
					}
				} else if (fieldState.type === 'entityList' && marker instanceof HasManyRelationMarker) {
					yield {
						type: 'entityList',
						marker,
						fieldState,
					}
				} else {
					console.warn(
						`You have encountered an edge case that is so far being deliberately ignored because it appears to be ` +
							`rare enough. Please report this bug.`,
						fieldState,
						marker,
					)
				}
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
