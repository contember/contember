import { Path } from 'slate'
import { EntityAccessor, EntityId } from '@contember/binding'
import { ReferencesOptions, useGetReferenceEntityList } from './useGetReferenceEntityList'
import { useCallback } from 'react'

export type GetReferencedEntity = (path: Path, id: EntityId) => EntityAccessor

export const useGetReferencedEntity = (opts: ReferencesOptions): GetReferencedEntity => {
	const getList = useGetReferenceEntityList(opts)
	return useCallback((path, id) => {
		const list = getList(path)
		return list.getChildEntityById(id)
	}, [getList])
}
