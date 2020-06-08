import * as React from 'react'
import { useParentEntityAccessor } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'

function useRelativeSingleEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity): EntityAccessor
function useRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined
function useRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined {
	const entity = useParentEntityAccessor()
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	return React.useMemo(
		() => (relativeSingleEntity ? entity.getRelativeSingleEntity(relativeSingleEntity) : relativeSingleEntity),
		[entity, relativeSingleEntity],
	)
}

export { useRelativeSingleEntity }
