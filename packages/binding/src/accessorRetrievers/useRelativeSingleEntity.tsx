import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'
import { useEntityAccessor } from '../accessorPropagation'

function useRelativeSingleEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity): EntityAccessor
function useRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined
function useRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined {
	const entity = useEntityAccessor()
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	return React.useMemo(
		() => (relativeSingleEntity ? entity.getRelativeSingleEntity(relativeSingleEntity) : relativeSingleEntity),
		[entity, relativeSingleEntity],
	)
}

export { useRelativeSingleEntity }
