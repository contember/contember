import {
	EntityFieldPersistedData,
	NormalizedQueryResponseData,
	PersistedEntityDataStore,
	QueryRequestResponse,
	ReceivedEntityData,
	ReceivedFieldData,
	ServerGeneratedUuid,
	SingleEntityPersistedData,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'

export class QueryResponseNormalizer {
	public static mergeInResponse(original: NormalizedQueryResponseData, response: QueryRequestResponse | undefined) {
		if (response === undefined) {
			return original
		}
		const { subTreeDataStore, persistedEntityDataStore } = original
		const { data } = response

		for (const treeId in data) {
			const treeDatum = data[treeId]

			if (treeDatum === undefined || treeDatum === null) {
				continue
			}
			const fieldData = this.createFieldData(persistedEntityDataStore, treeDatum)

			if (fieldData instanceof Set || (typeof fieldData === 'object' && fieldData !== null)) {
				subTreeDataStore.set(treeId, fieldData)
			} else {
				this.rejectData()
			}
		}
		return original
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

	private static mergeInEntityData(
		entityMap: PersistedEntityDataStore,
		target: SingleEntityPersistedData,
		newData: ReceivedEntityData,
	): SingleEntityPersistedData {
		for (const field in newData) {
			const fromTarget = target.get(field)
			const newDatum = newData[field]

			if (fromTarget === undefined) {
				target.set(field, this.createFieldData(entityMap, newDatum))
			} else if (fromTarget instanceof ServerGeneratedUuid) {
				if (newDatum === null) {
					target.set(field, null)
				} else if (typeof newDatum === 'object' && !Array.isArray(newDatum)) {
					const target = entityMap.get(fromTarget.value)
					if (target === undefined) {
						this.rejectData()
					}
					// Assuming the ids are the same.
					this.mergeInEntityData(entityMap, target, newDatum)
				} else {
					this.rejectData()
				}
			} else if (fromTarget instanceof Set) {
				if (Array.isArray(newDatum)) {
					fromTarget.clear()
					for (const entityData of newDatum) {
						fromTarget.add(this.createEntityData(entityMap, entityData))
					}
				} else {
					this.rejectData()
				}
			} else {
				if (Array.isArray(newDatum) || (typeof newDatum === 'object' && newDatum !== null)) {
					this.rejectData()
				} else {
					target.set(field, newDatum)
				}
			}
		}
		return target
	}

	private static rejectData(extraMessage?: string): never {
		throw new BindingError(`Failed to process data received from the API.${extraMessage ? `\n${extraMessage}` : ''}`)
	}
}
