import { EntityListAccessor, SugaredRelativeEntityList, useEntityList } from '@contember/react-binding'
import { useCallback } from 'react'

export interface ReferencesOptions {
	referencesField: SugaredRelativeEntityList['field']
}

export type GetReferenceEntityList = () => EntityListAccessor
export const useGetReferenceEntityList = ({
	referencesField,
}: ReferencesOptions): GetReferenceEntityList => {
	const referenceList = useEntityList({ field: referencesField })
	return useCallback(() => referenceList, [referenceList])
}
