import {
	NormalizedPersistedData,
	PersistedEntityDataStore,
	ReceivedDataTree,
	ReceivedEntityData,
	ServerId,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { EntityId } from '../treeParameters'
import {
	EntityFieldMarkers,
	EntityFieldMarkersContainer,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../markers'
import { SubMutationOperation } from './MutationGenerator'
import { assertNever } from '../utils'

export class RequestResponseNormalizer {
	public static mergeInQueryResponse(
		original: NormalizedPersistedData,
		newPersistedData: ReceivedDataTree,
		markerTree: MarkerTreeRoot,
	): void {
		const { subTreeDataStore, persistedEntityDataStore } = original

		for (const [placeholder, marker] of markerTree.subTrees) {
			const data = newPersistedData[placeholder] ?? null
			if (marker instanceof EntitySubTreeMarker) {
				if (data === null) {
					subTreeDataStore.delete(placeholder)
				} else {
					const entityData = this.createEntityData(persistedEntityDataStore, data as ReceivedEntityData, marker.fields.markers)
					subTreeDataStore.set(placeholder, entityData)
				}
			} else if (EntityListSubTreeMarker) {
				const subTreeListIds = new Set<EntityId>()
				for (const row of data as ReceivedEntityData[]) {
					subTreeListIds.add(this.createEntityData(persistedEntityDataStore, row, marker.fields.markers).value)
				}
				subTreeDataStore.set(placeholder, subTreeListIds)
			} else {
				throw new BindingError()
			}
		}
	}

	public static mergeInMutationResponse(
		original: NormalizedPersistedData,
		newPersistedData: ReceivedDataTree,
		operations: SubMutationOperation[],
	): void {

		const { subTreeDataStore, persistedEntityDataStore } = original

		for (const operation of operations) {
			const { subTreePlaceholder, subTreeType, alias } = operation

			const receivedData = newPersistedData[alias]

			const markers = 'markers' in operation ? operation.markers : undefined
			const id = this.createEntityData(persistedEntityDataStore, receivedData as ReceivedEntityData, markers)
			if (operation.type === 'update' || operation.type === 'create') {
				if (!receivedData) {
					throw new BindingError()
				}
				if (subTreeType === 'single') {
					subTreeDataStore.set(subTreePlaceholder, id)
				} else if (subTreeType === 'list') {
					const list = subTreeDataStore.get(subTreePlaceholder)

					if (list instanceof Set) {
						// TODO this is somewhat dubious because we're essentially just guessing the order of the entities
						//		and just carelessly put the new one at the end.
						list.add(id.value)
					} else if (list === undefined) {
						// That's fine. This is probably just an isCreating sub-tree.
						subTreeDataStore.set(subTreePlaceholder, new Set([id.value]))
					} else {
						throw new BindingError()
					}
				} else {
					return assertNever(subTreeType)
				}
			} else if (operation.type === 'delete') {
				// TODO there are potentially some references to entityId that this whole process won't quite remove.
				//		That's a memory leak. Probably not particularly severe in most cases but still.
				persistedEntityDataStore.delete(id.uniqueValue)
				if (subTreeType === 'single') {
					subTreeDataStore.delete(subTreePlaceholder)
				} else if (subTreeType === 'list') {
					const list = subTreeDataStore.get(subTreePlaceholder)

					if (!(list instanceof Set)) {
						throw new BindingError()
					}
					list.delete(id.value)
				} else {
					return assertNever(subTreeType)
				}
			} else {
					return assertNever(operation)
			}
		}
	}

	private static createEntityData(entityMap: PersistedEntityDataStore, entityData: ReceivedEntityData, fields?: EntityFieldMarkers): ServerId {
		const primaryKey: EntityId | undefined = entityData[PRIMARY_KEY_NAME]

		if (primaryKey === undefined) {
			throw new BindingError(`The server has responded with an entity that lacks a primary key.`)
		}

		const id = new ServerId(primaryKey, entityData.__typename)
		const presentEntityData = entityMap.get(id.uniqueValue) ?? new Map()
		entityMap.set(id.uniqueValue, presentEntityData)

		if (!fields) {
			return id
		}

		for (const [placeholder, field] of fields) {
			const value = entityData[placeholder]
			if (field instanceof FieldMarker) {
				presentEntityData.set(placeholder, value)
			} else if (field instanceof HasOneRelationMarker) {
				if (value === null) {
					presentEntityData.set(placeholder, null)
				} else {
					presentEntityData.set(placeholder, this.createEntityData(entityMap, value as ReceivedEntityData, field.fields.markers))
				}
			} else if (field instanceof HasManyRelationMarker) {
				const ids = presentEntityData.get(placeholder) ?? new Set()
				presentEntityData.set(placeholder, ids)
				if (!(ids instanceof Set)) {
					throw new BindingError()
				}
				ids.clear()
				for (const row of value as ReceivedEntityData[]) {
					ids.add(this.createEntityData(entityMap, row, field.fields.markers).value)
				}
			} else {
				throw new Error()
			}
		}

		return id
	}
}
