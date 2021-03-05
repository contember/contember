import {
	EntityFieldPersistedData,
	NormalizedQueryResponseData,
	PersistedEntityDataStore,
	ReceivedDataTree,
	ReceivedEntityData,
	ReceivedFieldData,
	ServerGeneratedUuid,
	SingleEntityPersistedData,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { AliasTransformer } from './AliasTransformer'

export class QueryResponseNormalizer {
	public static mergeInResponse(
		original: NormalizedQueryResponseData,
		newPersistedData: ReceivedDataTree,
	): Set<string> {
		const { subTreeDataStore, persistedEntityDataStore } = original
		const presentIds: Set<string> = new Set()

		for (const treeAlias in newPersistedData) {
			const treeDatum = newPersistedData[treeAlias]

			if (treeDatum === undefined || treeDatum === null) {
				continue
			}
			const [treeId, itemIdAlias] = AliasTransformer.splitAliasSections(treeAlias)

			if (itemIdAlias === undefined) {
				//const existingData = subTreeDataStore.get(treeId)

				const fieldData = this.createFieldData(persistedEntityDataStore, treeDatum)

				if (fieldData instanceof Set || (typeof fieldData === 'object' && fieldData !== null)) {
					subTreeDataStore.set(treeId, fieldData)
				} else {
					this.rejectData()
				}
				// TODO finish this
				// if (existingData === undefined) {
				// 	const fieldData = this.createFieldData(persistedEntityDataStore, treeDatum)
				//
				// 	if (fieldData instanceof Set || (typeof fieldData === 'object' && fieldData !== null)) {
				// 		subTreeDataStore.set(treeId, fieldData)
				// 	} else {
				// 		this.rejectData()
				// 	}
				// } else if (existingData instanceof ServerGeneratedUuid) {
				// 	//
				// } else if (existingData instanceof Set) {
				// } else {
				// 	return assertNever(existingData)
				// }
			} else {
				const entityId = AliasTransformer.aliasToEntityId(itemIdAlias)
				const existingData = persistedEntityDataStore.get(entityId)

				if (!Array.isArray(treeDatum) && existingData) {
					this.mergeInEntityData(persistedEntityDataStore, existingData, treeDatum)
				} else {
					this.rejectData()
				}
			}
		}
		return presentIds
	}

	private static createFieldData(
		entityMap: PersistedEntityDataStore,
		fieldData: ReceivedFieldData,
	): EntityFieldPersistedData {
		if (Array.isArray(fieldData)) {
			const subTreeListIds = new Set<string>()
			for (const entityDatum of fieldData) {
				subTreeListIds.add(this.createEntityData(entityMap, entityDatum))
			}
			return subTreeListIds
		} else if (fieldData !== null && typeof fieldData === 'object') {
			return new ServerGeneratedUuid(this.createEntityData(entityMap, fieldData))
		} else {
			return fieldData
		}
	}

	private static createEntityData(entityMap: PersistedEntityDataStore, entityData: ReceivedEntityData): string {
		const primaryKey: string | undefined = entityData[PRIMARY_KEY_NAME]

		if (primaryKey === undefined) {
			throw new BindingError(`The server has responded with an entity that lacks a primary key.`)
		}

		const presentEntityData = entityMap.get(primaryKey)

		if (presentEntityData === undefined) {
			const fieldsMap: SingleEntityPersistedData = new Map()
			entityMap.set(primaryKey, fieldsMap)
			for (const field in entityData) {
				const fieldDatum = entityData[field]

				fieldsMap.set(field, this.createFieldData(entityMap, fieldDatum))
			}
		} else {
			this.mergeInEntityData(entityMap, presentEntityData, entityData)
		}
		return primaryKey
	}

	private static mergeInFieldData(
		entityMap: PersistedEntityDataStore,
		fromTarget: EntityFieldPersistedData | undefined,
		newDatum: ReceivedFieldData,
	): EntityFieldPersistedData {
		if (fromTarget === undefined) {
			return this.createFieldData(entityMap, newDatum)
		}
		if (fromTarget instanceof ServerGeneratedUuid || (fromTarget === null && typeof newDatum === 'object')) {
			if (newDatum === null) {
				return null
			} else if (typeof newDatum === 'object' && !Array.isArray(newDatum)) {
				const newId = newDatum[PRIMARY_KEY_NAME]
				const target = entityMap.get(newId)
				if (target === undefined) {
					return this.rejectData()
				}

				if (fromTarget?.value === newId) {
					this.mergeInEntityData(entityMap, target, newDatum)
					return fromTarget
				} else {
					return new ServerGeneratedUuid(this.createEntityData(entityMap, newDatum))
				}
			}
		} else if (fromTarget instanceof Set) {
			if (Array.isArray(newDatum)) {
				fromTarget.clear()
				for (const entityData of newDatum) {
					fromTarget.add(this.createEntityData(entityMap, entityData))
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
