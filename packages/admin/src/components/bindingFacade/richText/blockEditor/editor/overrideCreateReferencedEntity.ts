import { BindingError, EntityAccessor, EntityListAccessor, SugaredRelativeEntityList } from '@contember/binding'
import { MutableRefObject } from 'react'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideCreateReferencedEntityOptions {
	//getMonolithicReferenceById: EntityListAccessor.GetChildEntityById | undefined
	createMonolithicReference: EntityListAccessor.CreateNewEntity | undefined
	referencesField: string | SugaredRelativeEntityList | undefined
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideCreateReferencedEntity = <E extends BlockSlateEditor>(
	editor: E,
	{ createMonolithicReference, referencesField, sortedBlocksRef }: OverrideCreateReferencedEntityOptions,
) => {
	editor.createReferencedEntity = (blockIndex, initialize) => {
		if (createMonolithicReference) {
			return createMonolithicReference(initialize)
		}
		if (referencesField === undefined) {
			throw new BindingError()
		}

		const sortedBlocks = sortedBlocksRef.current
		const containingBlock = sortedBlocks[blockIndex]
		const referenceList = containingBlock.getEntityList(referencesField)

		return referenceList.createNewEntity(initialize)
	}
}
