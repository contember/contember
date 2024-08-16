import { Editor } from 'slate'
import { EntityAccessor, generateUuid, PRIMARY_KEY_NAME, SugaredRelativeEntityList, SugaredRelativeSingleField, useBindingOperations } from '@contember/react-binding'
import { useGetReferenceEntityList } from './useGetReferenceEntityList'
import { useReferentiallyStableCallback } from '@contember/react-utils'

export type CreateElementReferences = (
	referenceType: string,
	initialize?: EntityAccessor.BatchUpdatesHandler
) => EntityAccessor

export const useCreateElementReference = ({ referencesField, referenceDiscriminationField, editor }: {
	referencesField: SugaredRelativeEntityList['field']
	referenceDiscriminationField: SugaredRelativeSingleField['field']
	editor: Editor
}): CreateElementReferences => {
	const getReferenceList = useGetReferenceEntityList({ referencesField })

	const bindingOperations = useBindingOperations()
	return useReferentiallyStableCallback((referenceType, initialize) => {
		const referenceUuid = generateUuid()
		const references = getReferenceList()
		Editor.withoutNormalizing(editor, () => {
			bindingOperations.batchDeferredUpdates(() => {
				const innerInitialize: EntityAccessor.BatchUpdatesHandler = (getNewReference, options) => {
					getNewReference().getField(PRIMARY_KEY_NAME).updateValue(referenceUuid)
					getNewReference().getField(referenceDiscriminationField).updateValue(referenceType)

					initialize?.(getNewReference, options)
				}
				references.createNewEntity(innerInitialize)
			})
		})
		return references.getChildEntityById(referenceUuid)
	})
}
