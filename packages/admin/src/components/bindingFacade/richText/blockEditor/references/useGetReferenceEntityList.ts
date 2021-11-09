import * as Slate from 'slate'
import {
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	SugaredRelativeEntityList,
	useEntityList,
} from '@contember/binding'
import { MutableRefObject, useCallback } from 'react'
import { useConstantValueInvariant } from '@contember/react-utils'

export interface ReferencesOptions {
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
	sortedBlocks: EntityAccessor[]
}

export type GetReferenceEntityList = (path: Slate.Path) => EntityListAccessor
export const useGetReferenceEntityList = ({
		referencesField,
		sortedBlocks,
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
		: useGetPerBlockReferenceList({ referencesField, sortedBlocks: sortedBlocks })
}

const useGetMonolithicReferenceList = ({ referencesField }: {
	referencesField: SugaredRelativeEntityList | string
}): GetReferenceEntityList => {
	const referenceList = useEntityList(referencesField)
	return useCallback(() => referenceList, [referenceList])
}

const useGetPerBlockReferenceList = ({ referencesField, sortedBlocks }: {
	referencesField: SugaredRelativeEntityList | string
	sortedBlocks: EntityAccessor[]
}): GetReferenceEntityList => {
	return useCallback(targetPath => {
		const blockIndex = targetPath[0]
		const containingBlock = sortedBlocks[blockIndex]
		return containingBlock.getEntityList(referencesField)
	}, [referencesField, sortedBlocks])
}
