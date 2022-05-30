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
	): Set<string> {
		const { subTreeDataStore, persistedEntityDataStore } = original
		const presentIds: Set<string> = new Set()

		for (const operationAlias in newPersistedData) {
			const operation = MutationAlias.decodeTopLevel(operationAlias)

			if (operation === undefined) {
				return this.rejectData()
			}
			const { type, entityId, subTreeType, subTreePlaceholder } = operation

			const treeDatum = newPersistedData[operationAlias]
			const fieldData = this.createFieldData(persistedEntityDataStore, treeDatum)
			if (!(fieldData instanceof ServerId)) {
				return this.rejectData()
			}

			switch (type) {
				case mutationOperationType.update:
				case mutationOperationType.create: {

					if (subTreeType === mutationOperationSubTreeType.singleEntity) {
						subTreeDataStore.set(subTreePlaceholder, fieldData)
					} else if (subTreeType === mutationOperationSubTreeType.entityList) {
						if (type === mutationOperationType.create) {
							const list = subTreeDataStore.get(subTreePlaceholder)

							if (list instanceof Set) {
								// TODO this is somewhat dubious because we're essentially just guessing the order of the entities
								//		and just carelessly put the new one at the end.
								list.add(fieldData.value)
							} else if (list === undefined) {
								// That's fine. This is probably just an isCreating sub-tree.
								subTreeDataStore.set(subTreePlaceholder, new Set([fieldData.value]))
							} else {
								return this.rejectData()
							}
						}
					} else {
						return assertNever(subTreeType)
					}

					break
				}
				case mutationOperationType.delete: {
					// TODO there are potentially some references to entityId that this whole process won't quite remove.
					//		That's a memory leak. Probably not particularly severe in most cases but still.
					persistedEntityDataStore.delete(fieldData.uniqueValue)
					if (subTreeType === mutationOperationSubTreeType.singleEntity) {
						subTreeDataStore.delete(subTreePlaceholder)
					} else if (subTreeType === mutationOperationSubTreeType.entityList) {
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
