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
	EntityFieldMarkersContainer,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../markers'

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
					const entityData = this.createEntityData(persistedEntityDataStore, data as ReceivedEntityData, marker.fields)
					subTreeDataStore.set(placeholder, entityData)
				}
			} else if (EntityListSubTreeMarker) {
				const subTreeListIds = new Set<EntityId>()
				for (const row of data as ReceivedEntityData[]) {
					subTreeListIds.add(this.createEntityData(persistedEntityDataStore, row, marker.fields).value)
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
	): void {
	}

	private static createEntityData(entityMap: PersistedEntityDataStore, entityData: ReceivedEntityData, fields: EntityFieldMarkersContainer): ServerId {
		const primaryKey: EntityId | undefined = entityData[PRIMARY_KEY_NAME]

		if (primaryKey === undefined) {
			throw new BindingError(`The server has responded with an entity that lacks a primary key.`)
		}

		const id = new ServerId(primaryKey, entityData.__typename)

		const presentEntityData = entityMap.get(id.uniqueValue) ?? new Map()
		entityMap.set(id.uniqueValue, presentEntityData)

		for (const [placeholder, field] of fields.markers) {
			const value = entityData[placeholder]
			if (field instanceof FieldMarker) {
				presentEntityData.set(placeholder, value)
			} else if (field instanceof HasOneRelationMarker) {
				if (value === null) {
					presentEntityData.set(placeholder, null)
				} else {
					presentEntityData.set(placeholder, this.createEntityData(entityMap, value as ReceivedEntityData, field.fields))
				}
			} else if (field instanceof HasManyRelationMarker) {
				const ids = presentEntityData.get(placeholder) ?? new Set()
				presentEntityData.set(placeholder, ids)
				if (!(ids instanceof Set)) {
					throw new BindingError()
				}
				ids.clear()
				for (const row of value as ReceivedEntityData[]) {
					ids.add(this.createEntityData(entityMap, row, field.fields).value)
				}
			} else {
				throw new Error()
			}
		}

		return id
	}
}
