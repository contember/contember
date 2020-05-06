import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useEntityAccessor } from '../accessorPropagation'
import { useOptionalDesugaredRelativeSingleEntity } from './useOptionalDesugaredRelativeSingleEntity'

export const useOptionalRelativeSingleEntity = (
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined => {
	const entity = useEntityAccessor()
	const relativeSingleEntity = useOptionalDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	return React.useMemo(
		() => (relativeSingleEntity ? entity.getRelativeSingleEntity(relativeSingleEntity) : undefined),
		[entity, relativeSingleEntity],
	)
}
