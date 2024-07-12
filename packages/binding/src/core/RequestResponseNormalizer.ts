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
					if (Array.isArray(data)) {
						throw new BindingError()
					}
					const id = this.processEntityData(persistedEntityDataStore, data, marker.fields.markers)
					subTreeDataStore.set(placeholder, id)
				}
			} else if (EntityListSubTreeMarker) {
				const subTreeListIds = new Set<EntityId>()
				if (!Array.isArray(data)) {
					throw new BindingError()
				}
				for (const row of data) {
					const id = this.processEntityData(persistedEntityDataStore, row, marker.fields.markers)
					subTreeListIds.add(id.value)
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
			if (!receivedData || Array.isArray(receivedData)) {
				throw new BindingError()
			}

			if (operation.type === 'update' || operation.type === 'create') {
				const id = this.processEntityData(persistedEntityDataStore, receivedData, operation.markers)
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
				const id = this.extractId(receivedData)
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

	private static processEntityData(entityMap: PersistedEntityDataStore, entityData: ReceivedEntityData, fields: EntityFieldMarkers): ServerId {
		const id = this.extractId(entityData)
		const presentEntityData = entityMap.get(id.uniqueValue) ?? new Map()
		entityMap.set(id.uniqueValue, presentEntityData)

		for (const [placeholder, field] of fields) {
			const value = entityData[placeholder]
			if (field instanceof FieldMarker) {
				presentEntityData.set(placeholder, value)
			} else if (field instanceof HasOneRelationMarker) {
				if (value === null) {
					presentEntityData.set(placeholder, null)
				} else {
					presentEntityData.set(placeholder, this.processEntityData(entityMap, value as ReceivedEntityData, field.fields.markers))
				}
			} else if (field instanceof HasManyRelationMarker) {
				const ids = presentEntityData.get(placeholder) ?? new Set()
				presentEntityData.set(placeholder, ids)
				if (!(ids instanceof Set)) {
					throw new BindingError()
				}
				ids.clear()
				for (const row of value as ReceivedEntityData[]) {
					const id = this.processEntityData(entityMap, row, field.fields.markers)
					ids.add(id.value)
				}
			} else {
				throw new Error()
			}
		}

		return id
	}

	private static extractId(entityData: ReceivedEntityData): ServerId {
		const primaryKey: EntityId | undefined = entityData[PRIMARY_KEY_NAME]

		if (primaryKey === undefined) {
			throw new BindingError(`The server has responded with an entity that lacks a primary key.`)
		}

		return new ServerId(primaryKey, entityData.__typename)
	}
}
