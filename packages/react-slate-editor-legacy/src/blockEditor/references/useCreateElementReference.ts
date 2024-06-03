import * as Slate from 'slate'
import { Editor } from 'slate'
import {
	EntityAccessor,
	EntityListAccessor,
	FieldValue,
	generateUuid,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useBindingOperations,
} from '@contember/react-binding'
import { MutableRefObject, useCallback } from 'react'
import { useGetReferenceEntityList } from './useGetReferenceEntityList'

export type CreateElementReferences = (
	editor: Editor,
	targetPath: Slate.Path,
	referenceDiscriminant: FieldValue,
	initialize?: EntityAccessor.BatchUpdatesHandler
) => EntityAccessor

export const useCreateElementReference = ({ monolithicReferencesMode, sortedBlocksRef, referenceDiscriminationField, referencesField, refreshBlocks }: {
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
	referenceDiscriminationField?: SugaredFieldProps['field']
	refreshBlocks: () => void
}): CreateElementReferences => {
	const getReferenceList = useGetReferenceEntityList({ monolithicReferencesMode, sortedBlocksRef, referencesField })

	// eslint-disable-next-line react-hooks/rules-of-hooks
	return useCreateElementReferenceInternal({
		referenceDiscriminationField: referenceDiscriminationField!,
		getReferenceList,
		refreshBlocks,
	})
}

const useCreateElementReferenceInternal = ({ referenceDiscriminationField, getReferenceList, refreshBlocks }: {
	referenceDiscriminationField: SugaredFieldProps['field']
	getReferenceList: (path: Slate.Path) => EntityListAccessor
	refreshBlocks: () => void
}): CreateElementReferences => {
	const bindingOperations = useBindingOperations()
	return useCallback((editor, path, referenceDiscriminant, initialize) => {
		const referenceUuid = generateUuid()
		refreshBlocks()

		const references = getReferenceList(path)
		Editor.withoutNormalizing(editor, () => {
			bindingOperations.batchDeferredUpdates(() => {
				const innerInitialize: EntityAccessor.BatchUpdatesHandler = (getNewReference, options) => {
					getNewReference().getField('id').updateValue(referenceUuid)
					getNewReference().getField(referenceDiscriminationField).updateValue(referenceDiscriminant)

					initialize?.(getNewReference, options)
				}
				references.createNewEntity(innerInitialize)
			})
		})
		return references.getChildEntityById(referenceUuid)
	}, [bindingOperations, getReferenceList, referenceDiscriminationField, refreshBlocks])
}
