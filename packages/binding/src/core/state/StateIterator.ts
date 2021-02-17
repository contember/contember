import {
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../../markers'
import { PlaceholderName } from '../../treeParameters'
import { assertNever } from '../../utils'
import { TreeStore } from '../TreeStore'
import { EntityListState } from './EntityListState'
import { EntityRealmState, EntityRealmStateStub } from './EntityRealmState'
import { FieldState } from './FieldState'
import { getEntityMarker } from './getEntityMarker'
import { RootStateNode, StateINode, StateNode } from './StateNode'
import { StateType } from './StateType'

export class StateIterator {
	public static *eachSiblingRealm(
		state: EntityRealmState,
		relevantPlaceholder?: PlaceholderName,
	): IterableIterator<EntityRealmState> {
		for (let [realmKey, realm] of state.entity.realms) {
			if (realm.type === StateType.EntityRealmStub) {
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
		if (state.type === StateType.EntityList && state.blueprint.parent === undefined) {
			// Top-level entity list
			for (const [, rootStates] of treeStore.subTreeStatesByRoot) {
				const rootList = rootStates.get(state.blueprint.marker.placeholderName)
				if (rootList?.type === StateType.EntityList) {
					yield rootList as S
				}
			}
			return
		}

		let closestEntityRealm: EntityRealmState
		let placeholderName: PlaceholderName

		if (state.type === StateType.Field) {
			closestEntityRealm = state.parent
			placeholderName = state.placeholderName
		} else if (state.type === StateType.EntityList) {
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
		| { type: StateType.EntityRealm; marker: HasOneRelationMarker; fieldState: EntityRealmState }
		| { type: StateType.Field; marker: FieldMarker; fieldState: FieldState }
		| { type: StateType.EntityList; marker: HasManyRelationMarker; fieldState: EntityListState }
	> {
		if (realm.type === StateType.EntityRealmStub) {
			return
		}
		const visited: Set<PlaceholderName> = new Set()

		for (const siblingRealm of realm.entity.realms.values()) {
			const fields = getEntityMarker(siblingRealm).fields.markers

			for (const [placeholderName, fieldState] of realm.children) {
				if (fieldState.type === StateType.EntityRealmStub || visited.has(placeholderName)) {
					continue
				}
				const marker = fields.get(placeholderName)

				if (
					marker === undefined ||
					marker instanceof EntitySubTreeMarker ||
					marker instanceof EntityListSubTreeMarker
				) {
					continue
				}
				visited.add(placeholderName)

				if (fieldState.type === StateType.Field && marker instanceof FieldMarker) {
					yield {
						type: StateType.Field,
						marker,
						fieldState,
					}
				} else if (fieldState.type === StateType.EntityRealm && marker instanceof HasOneRelationMarker) {
					yield {
						type: StateType.EntityRealm,
						marker,
						fieldState,
					}
				} else if (fieldState.type === StateType.EntityList && marker instanceof HasManyRelationMarker) {
					yield {
						type: StateType.EntityList,
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

	public static *depthFirstINodes(
		root: StateINode,
		match?: (iNode: StateINode) => boolean,
	): IterableIterator<StateINode> {
		yield* this.depthFirstINodesImplementation(root, match)
	}

	private static *depthFirstINodesImplementation(
		root: StateINode | EntityRealmStateStub,
		match?: (iNode: StateINode) => boolean,
	): IterableIterator<StateINode> {
		// Ignore uninitialized. Is that always correct though? This should probably be configurable.
		if (root.type === StateType.EntityRealmStub) {
			return
		}
		switch (root.type) {
			case StateType.EntityRealm:
			case StateType.EntityList:
				for (const childState of root.children.values()) {
					if (childState.type === StateType.EntityRealm || childState.type === StateType.EntityList) {
						yield* this.depthFirstINodesImplementation(childState, match)
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
