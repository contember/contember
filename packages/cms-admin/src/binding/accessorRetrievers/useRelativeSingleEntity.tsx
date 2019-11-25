import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { getRelativeSingleEntity } from './getRelativeSingleEntity'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'
import { useEntityContext } from './useEntityContext'

export const useRelativeSingleEntity = (sugaredRelativeSingleEntity: SugaredRelativeSingleEntity): EntityAccessor => {
	const entity = useEntityContext()
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	return React.useMemo(() => getRelativeSingleEntity(entity, relativeSingleEntity), [entity, relativeSingleEntity])
}
