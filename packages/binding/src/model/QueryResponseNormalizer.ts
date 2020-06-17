import {
	BoxedSingleEntityId,
	NormalizedQueryResponseData,
	PersistedEntityDataStore,
	QueryRequestResponse,
	ReceivedEntityData,
	SingleEntityPersistedData,
	SubTreeDataStore,
} from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'

export class QueryResponseNormalizer {
	public static normalizeResponse(response: QueryRequestResponse): NormalizedQueryResponseData {
		const { data } = response
		const entityMap: PersistedEntityDataStore = new Map()
		const subTreeMap: SubTreeDataStore = new Map()

		for (const treeId in data) {
			const treeDatum = data[treeId]

			if (treeDatum === undefined) {
				continue
			}
			if (Array.isArray(treeDatum)) {
				const subTreeListIds = new Set<string>()
				for (const entityDatum of treeDatum) {
					subTreeListIds.add(this.addEntityResponse(entityMap, entityDatum))
				}
				subTreeMap.set(treeId, subTreeListIds)
			} else {
				subTreeMap.set(treeId, new BoxedSingleEntityId(this.addEntityResponse(entityMap, treeDatum)))
			}
		}

		return new NormalizedQueryResponseData(subTreeMap, entityMap)
	}

	private static addEntityResponse(entityMap: PersistedEntityDataStore, entityData: ReceivedEntityData): string {
		const fieldsMap: SingleEntityPersistedData = new Map()
		let primaryKey: string | undefined = undefined

		for (const field in entityData) {
			const fieldDatum = entityData[field]

			if (field === PRIMARY_KEY_NAME) {
				primaryKey = fieldDatum as string
			}
			if (Array.isArray(fieldDatum)) {
				const ids = new Set<string>()

				for (const entityDatum of fieldDatum) {
					ids.add(this.addEntityResponse(entityMap, entityDatum))
				}

				fieldsMap.set(field, ids)
			} else if (fieldDatum !== null && typeof fieldDatum === 'object') {
				fieldsMap.set(field, new BoxedSingleEntityId(this.addEntityResponse(entityMap, fieldDatum)))
			} else {
				fieldsMap.set(field, fieldDatum)
			}
		}
		if (primaryKey === undefined) {
			throw new BindingError(`The server has responded with an entity that lacks a primary key.`)
		}

		const presentEntityData = entityMap.get(primaryKey)
		if (presentEntityData === undefined) {
			entityMap.set(primaryKey, fieldsMap)
		} else {
			entityMap.set(primaryKey, this.mergeEntityData(presentEntityData, fieldsMap))
		}
		return primaryKey
	}

	private static mergeEntityData(
		original: SingleEntityPersistedData,
		fresh: SingleEntityPersistedData,
	): SingleEntityPersistedData {
		for (const [field, fromFresh] of fresh) {
			const fromOriginal = original.get(field)
			if (fromOriginal === undefined) {
				original.set(field, fromFresh)
			} else if (__DEV_MODE__) {
				if (fromOriginal instanceof BoxedSingleEntityId) {
					if (!(fromFresh instanceof BoxedSingleEntityId)) {
						throw new BindingError() // TODO msg
					}
					if (fromOriginal.id !== fromFresh.id) {
						throw new BindingError() // TODO msg
					}
				} else if (fromOriginal instanceof Set) {
					if (!(fromFresh instanceof Set)) {
						throw new BindingError() // TODO msg
					}
					// TODO check that they're the same in size as well as contents
				} else {
					if (fromOriginal !== fromFresh) {
						throw new BindingError() // TODO msg
					}
				}
			}
		}
		return original
	}
}
