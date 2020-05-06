import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'
import { useEntityAccessor } from '../accessorPropagation'

export const useRelativeSingleEntity = (
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
): EntityAccessor => {
	const entity = useEntityAccessor()
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	return React.useMemo(() => entity.getRelativeSingleEntity(relativeSingleEntity), [entity, relativeSingleEntity])
}
