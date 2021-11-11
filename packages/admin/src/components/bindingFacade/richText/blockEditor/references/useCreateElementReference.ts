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
} from '@contember/binding'
import { useCallback } from 'react'
import { useGetReferenceEntityList } from './useGetReferenceEntityList'

export type CreateElementReferences = (
	editor: Editor,
	targetPath: Slate.Path,
	referenceDiscriminant: FieldValue,
	initialize?: EntityAccessor.BatchUpdatesHandler
) => EntityAccessor

export const useCreateElementReference = ({ monolithicReferencesMode, sortedBlocks, referenceDiscriminationField, referencesField }: {
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
	sortedBlocks: EntityAccessor[]
	referenceDiscriminationField?: SugaredFieldProps['field']
}): CreateElementReferences => {
	const getReferenceList = useGetReferenceEntityList({ monolithicReferencesMode, sortedBlocks, referencesField })

	// eslint-disable-next-line react-hooks/rules-of-hooks
	return useCreateElementReferenceInternal({
		referenceDiscriminationField: referenceDiscriminationField!,
		getReferenceList,
	})
}

const useCreateElementReferenceInternal = ({ referenceDiscriminationField, getReferenceList }: {
	referenceDiscriminationField: SugaredFieldProps['field'],
	getReferenceList: (path: Slate.Path) => EntityListAccessor,
}): CreateElementReferences => {
	const bindingOperations = useBindingOperations()
	return useCallback((editor, path, referenceDiscriminant, initialize) => {
		const referenceUuid = generateUuid()

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
	}, [bindingOperations, getReferenceList, referenceDiscriminationField])
}
