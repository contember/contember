import {
	EntityFieldPersistedData,
	NormalizedPersistedData,
	PersistedEntityDataStore,
	ReceivedDataTree,
	ReceivedEntityData,
	ReceivedFieldData,
	ServerGeneratedUuid,
	SingleEntityPersistedData,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { assertNever } from '../utils'
import { MutationAlias, MutationOperationSubTreeType, MutationOperationType } from './requestAliases'

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
	): Set<string> {
		const { subTreeDataStore, persistedEntityDataStore } = original
		const presentIds: Set<string> = new Set()

		for (const operationAlias in newPersistedData) {
			const operation = MutationAlias.decodeTopLevel(operationAlias)

			if (operation === undefined) {
				return this.rejectData()
			}
			const { type, entityId, subTreeType, subTreePlaceholder } = operation

			switch (type) {
				case MutationOperationType.Update:
				case MutationOperationType.Create: {
					const treeDatum = newPersistedData[operationAlias]
					const fieldData = this.createFieldData(persistedEntityDataStore, treeDatum)

					if (subTreeType === MutationOperationSubTreeType.SingleEntity) {
						if (fieldData instanceof ServerGeneratedUuid) {
							subTreeDataStore.set(subTreePlaceholder, fieldData)
						} else {
							return this.rejectData()
						}
					} else if (subTreeType === MutationOperationSubTreeType.EntityList) {
						if (fieldData instanceof ServerGeneratedUuid) {
							if (type === MutationOperationType.Create) {
								const list = subTreeDataStore.get(subTreePlaceholder)
								if (!(list instanceof Set)) {
									return this.rejectData()
								}

								// TODO this is somewhat dubious because we're essentially just guessing the order of the entities
								//		and just carelessly put the new one at the end.
								list.add(fieldData.value)
							}
						} else {
							return this.rejectData()
						}
					} else {
						return assertNever(subTreeType)
					}

					break
				}
				case MutationOperationType.Delete: {
					// TODO there are potentially some references to entityId that this whole process won't quite remove.
					//		That's a memory leak. Probably not particularly severe in most cases but still.
					persistedEntityDataStore.delete(entityId)
					if (subTreeType === MutationOperationSubTreeType.SingleEntity) {
						subTreeDataStore.delete(subTreePlaceholder)
					} else if (subTreeType === MutationOperationSubTreeType.EntityList) {
						const list = subTreeDataStore.get(subTreePlaceholder)

						if (!(list instanceof Set)) {
							return this.rejectData()
						}
						list.delete(entityId)
					} else {
						return assertNever(subTreeType)
					}
					break
				}
				default:
					return assertNever(type)
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
					return new ServerGeneratedUuid(this.createEntityData(entityMap, newDatum))
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
