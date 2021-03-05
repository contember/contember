import { BindingError, EntityAccessor, EntityListAccessor, SugaredRelativeEntityList } from '@contember/binding'
import { MutableRefObject } from 'react'
import { ReactEditor } from 'slate-react'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideGetReferencedEntityOptions {
	getMonolithicReferenceById: EntityListAccessor.GetChildEntityById | undefined
	referencesField: string | SugaredRelativeEntityList | undefined
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideGetReferencedEntity = <E extends BlockSlateEditor>(
	editor: E,
	{ getMonolithicReferenceById, referencesField, sortedBlocksRef }: OverrideGetReferencedEntityOptions,
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

		let topLevelIndex: number
		let referenceId: string
		if (typeof elementOrReferenceId === 'string') {
			// TODO This entire branch is awful and needs to go.
			const selection = editor.selection
			if (!selection) {
				throw new BindingError()
			}
			topLevelIndex = selection.focus.path[0] // ...
			referenceId = elementOrReferenceId
		} else {
			const elementPath = ReactEditor.findPath(editor, elementOrReferenceId)
			topLevelIndex = elementPath[0]
			referenceId = elementOrReferenceId.referenceId
		}
		const sortedBlocks = sortedBlocksRef.current
		const containingBlock = sortedBlocks[topLevelIndex]
		const referenceList = containingBlock.getEntityList(referencesField)

		return referenceList.getChildEntityById(referenceId)
	}
}
