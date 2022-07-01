import {
	EntityFieldPersistedData,
	NormalizedPersistedData,
	PersistedEntityDataStore,
	ReceivedDataTree,
	ReceivedEntityData,
	ReceivedFieldData,
	ServerId,
	SingleEntityPersistedData,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { assertNever } from '../utils'
import { MutationAlias, mutationOperationSubTreeType, mutationOperationType } from './requestAliases'
import { EntityId } from '../treeParameters'

export class RequestResponseNormalizer {
	public static mergeInQueryResponse(
		original: NormalizedPersistedData,
		newPersistedData: ReceivedDataTree,
	): Set<string> {
		const { subTreeDataStore, persistedEntityDataStore } = original
		const presentIds: Set<string> = new Set()

		for (const placeholderName in newPersistedData) {
			const treeDatum = newPersistedData[placeholderName]

			const fieldData = this.createFieldData(persistedEntityDataStore, treeDatum)

			if (fieldData === null) {
				subTreeDataStore.delete(placeholderName)
			} else if (fieldData instanceof Set || typeof fieldData === 'object') {
				subTreeDataStore.set(placeholderName, fieldData)
			} else {
				this.rejectData()
			}
		}
		return presentIds
	}

	public static mergeInMutationResponse(
		original: NormalizedPersistedData,
		newPersistedData: ReceivedDataTree,
	): void {
	}

	private static createFieldData(
		entityMap: PersistedEntityDataStore,
		fieldData: ReceivedFieldData,
	): EntityFieldPersistedData {
		if (Array.isArray(fieldData)) {
			const subTreeListIds = new Set<EntityId>()
			for (const entityDatum of fieldData) {
				subTreeListIds.add(this.createEntityData(entityMap, entityDatum).value)
			}
			return subTreeListIds
		} else if (fieldData !== null && typeof fieldData === 'object') {
			return this.createEntityData(entityMap, fieldData)
		} else {
			return fieldData
		}
	}

	private static createEntityData(entityMap: PersistedEntityDataStore, entityData: ReceivedEntityData): ServerId {
		const primaryKey: EntityId | undefined = entityData[PRIMARY_KEY_NAME]

		if (primaryKey === undefined) {
			throw new BindingError(`The server has responded with an entity that lacks a primary key.`)
		}

		const id = new ServerId(primaryKey, entityData.__typename)

		const presentEntityData = entityMap.get(id.uniqueValue)

		if (presentEntityData === undefined) {
			const fieldsMap: SingleEntityPersistedData = new Map()
			entityMap.set(id.uniqueValue, fieldsMap)
			for (const field in entityData) {
				const fieldDatum = entityData[field]

				fieldsMap.set(field, this.createFieldData(entityMap, fieldDatum))
			}
		} else {
			this.mergeInEntityData(entityMap, presentEntityData, entityData)
		}
		return id
	}

	private static mergeInFieldData(
		entityMap: PersistedEntityDataStore,
		fromTarget: EntityFieldPersistedData | undefined,
		newDatum: ReceivedFieldData,
	): EntityFieldPersistedData {
		if (fromTarget === undefined) {
			return this.createFieldData(entityMap, newDatum)
		}
		if (fromTarget instanceof ServerId || (fromTarget === null && typeof newDatum === 'object')) {
			if (newDatum === null) {
				return null
			} else if (typeof newDatum === 'object' && !Array.isArray(newDatum)) {
				const newId = newDatum[PRIMARY_KEY_NAME]
				const target = entityMap.get(ServerId.formatUniqueValue(newId, newDatum.__typename))
				if (target === undefined) {
					return this.createEntityData(entityMap, newDatum)
				}

				if (fromTarget?.value === newId) {
					this.mergeInEntityData(entityMap, target, newDatum)
					return fromTarget
				} else {
					return this.createEntityData(entityMap, newDatum)
				}
			}
		} else if (fromTarget instanceof Set) {
			if (Array.isArray(newDatum)) {
				fromTarget.clear()
				for (const entityData of newDatum) {
					fromTarget.add(this.createEntityData(entityMap, entityData).value)
				}
				return fromTarget
			}
		} else if (!Array.isArray(newDatum) && (newDatum === null || typeof newDatum !== 'object')) {
			return newDatum
		}
		return this.rejectData()
	}

	private static mergeInEntityData(
		entityMap: PersistedEntityDataStore,
		target: SingleEntityPersistedData,
		newData: ReceivedEntityData,
	): SingleEntityPersistedData {
		for (const field in newData) {
			const fromTarget = target.get(field)
			const newDatum = newData[field]

			target.set(field, this.mergeInFieldData(entityMap, fromTarget, newDatum))
		}
		return target
	}

	private static rejectData(extraMessage?: string): never {
		throw new BindingError(`Failed to process data received from the API.${extraMessage ? `\n${extraMessage}` : ''}`)
	}
}
