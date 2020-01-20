import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'
import { useEntityContext } from './useEntityContext'

export const useRelativeSingleEntity = (
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
): EntityAccessor => {
	const entity = useEntityContext()
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	return React.useMemo(() => entity.getRelativeSingleEntity(relativeSingleEntity), [entity, relativeSingleEntity])
}
