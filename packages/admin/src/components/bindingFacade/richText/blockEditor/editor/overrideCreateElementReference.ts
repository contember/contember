import {
	BindingError,
	BindingOperations,
	EntityAccessor,
	RelativeSingleField,
	SugaredRelativeEntityList,
} from '@contember/binding'
import type { MutableRefObject } from 'react'
import { Editor } from 'slate'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideCreateElementReferenceOptions {
	bindingOperations: BindingOperations
	createMonolithicReference: ((initialize: EntityAccessor.BatchUpdatesHandler) => void) | undefined
	referenceDiscriminationField: RelativeSingleField | undefined
	referencesField: string | SugaredRelativeEntityList | undefined
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideCreateElementReference = <E extends BlockSlateEditor>(
	editor: E,
	options: OverrideCreateElementReferenceOptions,
) => {
	const {
		bindingOperations,
		createMonolithicReference,
		referenceDiscriminationField,
		referencesField,
		sortedBlocksRef,
	} = options
	if (referenceDiscriminationField === undefined) {
		return
	}
	editor.createElementReference = (targetPath, referenceDiscriminant, initialize) => {
		const invalidFallbackUuid = 'richEditorIsBroken'
		let referenceUuid = invalidFallbackUuid

		Editor.withoutNormalizing(editor, () => {
			bindingOperations.batchDeferredUpdates(() => {
				const innerInitialize: EntityAccessor.BatchUpdatesHandler = (getNewReference, options) => {
					getNewReference().getField('id').asUuid.setToUuid()
					getNewReference().getField(referenceDiscriminationField).updateValue(referenceDiscriminant)

					referenceUuid = getNewReference().getField<string>('id').value!

					initialize?.(getNewReference, options)
				}

				if (createMonolithicReference) {
					return createMonolithicReference(innerInitialize)
				}
				if (referencesField === undefined) {
					throw new BindingError()
				}

				const blockIndex = targetPath[0]
				const sortedBlocks = sortedBlocksRef.current
				const containingBlock = sortedBlocks[blockIndex]
				const referenceList = containingBlock.getEntityList(referencesField)

				return referenceList.createNewEntity(innerInitialize)
			})
		})

		if (referenceUuid === invalidFallbackUuid) {
			throw new BindingError()
		}

		return referenceUuid
	}
}
