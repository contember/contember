import {
	EntityFieldPersistedData,
	EntityListPersistedData,
	NormalizedQueryResponseData,
	PersistedEntityDataStore,
	QueryRequestResponse,
	ReceivedEntityData,
	ReceivedFieldData,
	ServerGeneratedUuid,
	SingleEntityPersistedData,
	SubTreeDataStore,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'

export class QueryResponseNormalizer {
	public static normalizeResponse(response: QueryRequestResponse | undefined): NormalizedQueryResponseData {
		const entityMap: PersistedEntityDataStore = new Map()
		const subTreeMap: SubTreeDataStore = new Map()

		if (response === undefined) {
			return new NormalizedQueryResponseData(subTreeMap, entityMap)
		}

		const { data } = response

		for (const treeId in data) {
			const treeDatum = data[treeId]

			if (treeDatum === undefined || treeDatum === null) {
				continue
			}
			subTreeMap.set(
				treeId,
				this.createFieldData(entityMap, treeDatum) as ServerGeneratedUuid | EntityListPersistedData,
			)
		}

		return new NormalizedQueryResponseData(subTreeMap, entityMap)
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
					// Assuming the set themselves are the same. This should be encoded in the placeholder. If that isn't the case,
					// our hash function has had a conflict or something else has gone horribly wrong beyond repair.

					let i = 0
					for (const listId of fromTarget) {
						const target = entityMap.get(listId)
						if (target === undefined) {
							this.rejectData()
						}
						const listEntityDatum = newDatum[i]
						this.mergeInEntityData(entityMap, target!, listEntityDatum)
						i++
					}
				} else {
					this.rejectData()
				}
			} else if (fromTarget === newDatum) {
				// They are both scalars. Do nothing.
			} else {
				this.rejectData()
			}
		}
		return target
	}

	private static rejectData(extraMessage?: string): never {
		throw new BindingError(`Failed to process data received from the API.${extraMessage ? `\n${extraMessage}` : ''}`)
	}
}
