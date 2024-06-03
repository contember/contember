import * as Slate from 'slate'
import {
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	SugaredRelativeEntityList,
	useEntityList,
} from '@contember/react-binding'
import { MutableRefObject, useCallback } from 'react'
import { useConstantValueInvariant } from '@contember/react-utils'

export interface ReferencesOptions {
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export type GetReferenceEntityList = (path: Slate.Path) => EntityListAccessor
export const useGetReferenceEntityList = ({
	referencesField,
	sortedBlocksRef,
	monolithicReferencesMode,
}: ReferencesOptions): GetReferenceEntityList => {
	useConstantValueInvariant(referencesField)
	useConstantValueInvariant(monolithicReferencesMode)
	if (!referencesField) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useCallback(() => {
			throw new BindingError(
				`BlockEditor: trying to get or insert a referenced element but referencing has not been correctly set up. ` +
				`Check the BlockEditor props.`,
			)
		}, [])
	}
	return monolithicReferencesMode
		// eslint-disable-next-line react-hooks/rules-of-hooks
		? useGetMonolithicReferenceList({ referencesField })
		// eslint-disable-next-line react-hooks/rules-of-hooks
		: useGetPerBlockReferenceList({ referencesField, sortedBlocksRef: sortedBlocksRef })
}

const useGetMonolithicReferenceList = ({ referencesField }: {
	referencesField: SugaredRelativeEntityList | string
}): GetReferenceEntityList => {
	const referenceList = useEntityList(referencesField)
	return useCallback(() => referenceList, [referenceList])
}

const useGetPerBlockReferenceList = ({ referencesField, sortedBlocksRef }: {
	referencesField: SugaredRelativeEntityList | string
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}): GetReferenceEntityList => {
	return useCallback(targetPath => {
		const blockIndex = targetPath[0]
		const containingBlock = sortedBlocksRef.current[blockIndex]
		if (!containingBlock) {
			throw new BindingError()
		}
		return containingBlock.getEntityList(referencesField)
	}, [referencesField, sortedBlocksRef])
}
