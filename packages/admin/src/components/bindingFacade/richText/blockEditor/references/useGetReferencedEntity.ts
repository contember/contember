import { Path } from 'slate'
import { EntityAccessor } from '@contember/binding'
import { ReferencesOptions, useGetReferenceEntityList } from './useGetReferenceEntityList'
import { useCallback } from 'react'

export type GetReferencedEntity = (path: Path, id: string) => EntityAccessor

export const useGetReferencedEntity = (opts: ReferencesOptions): GetReferencedEntity => {
	const getList = useGetReferenceEntityList(opts)
	return useCallback((path, id) => {
		return getList(path).getChildEntityById(id)
	}, [getList])
}
