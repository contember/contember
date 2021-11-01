import {
	BindingError,
	BindingOperations,
	EntityAccessor,
	EntityId,
	EntityRealmKey,
	RelativeEntityList,
	SugaredRelativeEntityList,
} from '@contember/binding'
import type { MutableRefObject } from 'react'
import type { EditorWithBlocks } from './EditorWithBlocks'

export interface OverrideGetReferencedEntityOptions {
	bindingOperations: BindingOperations
	desugaredBlockList: RelativeEntityList
	getMonolithicReferenceById: ((id: EntityId) => EntityAccessor) | undefined
	getParentEntityRef: MutableRefObject<EntityAccessor.GetEntityAccessor>
	referencedEntityCache: Map<EntityId, EntityRealmKey>
	referencesField: string | SugaredRelativeEntityList | undefined
}

export const overrideGetReferencedEntity = <E extends EditorWithBlocks>(
	editor: E,
	{
		bindingOperations,
		desugaredBlockList,
		getMonolithicReferenceById,
		getParentEntityRef,
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
			const blockList = getParentEntityRef.current().getRelativeEntityList(desugaredBlockList)

			for (const blockEntity of blockList) {
				for (const referenceEntity of blockEntity.getEntityList(referencesField)) {
					referencedEntityCache.set(referenceEntity.id, referenceEntity.key)
				}
			}

			containingBlockKey = referencedEntityCache.get(referenceId)
			if (containingBlockKey === undefined) {
				throw new BindingError()
			}
		}
		return bindingOperations.getEntityByKey(containingBlockKey)
	}
}
