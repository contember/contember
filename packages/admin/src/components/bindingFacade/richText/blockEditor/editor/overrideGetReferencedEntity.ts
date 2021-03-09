import {
	BindingError,
	BindingOperations,
	EntityAccessor,
	EntityId,
	EntityListAccessor,
	EntityRealmKey,
	RelativeEntityList,
	SugaredRelativeEntityList,
} from '@contember/binding'
import { MutableRefObject } from 'react'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideGetReferencedEntityOptions {
	batchUpdatesRef: MutableRefObject<EntityAccessor.BatchUpdates>
	bindingOperations: BindingOperations
	desugaredBlockList: RelativeEntityList
	getMonolithicReferenceById: EntityListAccessor.GetChildEntityById | undefined
	referencedEntityCache: Map<EntityId, EntityRealmKey>
	referencesField: string | SugaredRelativeEntityList | undefined
}

export const overrideGetReferencedEntity = <E extends BlockSlateEditor>(
	editor: E,
	{
		batchUpdatesRef,
		bindingOperations,
		desugaredBlockList,
		getMonolithicReferenceById,
		referencedEntityCache,
		referencesField,
	}: OverrideGetReferencedEntityOptions,
) => {
	editor.getReferencedEntity = elementOrReferenceId => {
		if (getMonolithicReferenceById) {
			return getMonolithicReferenceById(
				typeof elementOrReferenceId === 'string' ? elementOrReferenceId : elementOrReferenceId.referenceId,
			)
		}
		if (referencesField === undefined) {
			throw new BindingError()
		}

		const referenceId =
			typeof elementOrReferenceId === 'string' ? elementOrReferenceId : elementOrReferenceId.referenceId

		let containingBlockKey = referencedEntityCache.get(referenceId)

		if (containingBlockKey === undefined) {
			bindingOperations.batchDeferredUpdates(() => {
				batchUpdatesRef.current(getEntity => {
					const blockList = getEntity().getRelativeEntityList(desugaredBlockList)

					for (const blockEntity of blockList) {
						for (const referenceEntity of blockEntity.getEntityList(referencesField)) {
							referencedEntityCache.set(referenceEntity.id, referenceEntity.key)
						}
					}
				})
			})
			containingBlockKey = referencedEntityCache.get(referenceId)
			if (containingBlockKey === undefined) {
				throw new BindingError()
			}
		}
		return bindingOperations.getEntityByKey(containingBlockKey)
	}
}
