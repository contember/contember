import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { SugaredRelativeSingleEntity } from '../treeParameters'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'
import { useEntityAccessorUpdateSubscription } from './useEntityAccessorUpdateSubscription'

function useRelativeSingleEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity): EntityAccessor
function useRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined
function useRelativeSingleEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined {
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)

	useConstantValueInvariant(
		!!relativeSingleEntity,
		'useRelativeSingleEntity: cannot alternate between providing and omitting the argument.',
	)

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()

	const getEntity = React.useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getRelativeSingleEntity(relativeSingleEntity!)
	}, [entityKey, getEntityByKey, relativeSingleEntity])

	if (relativeSingleEntity) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useEntityAccessorUpdateSubscription(getEntity)
	}
	return undefined
}

export { useRelativeSingleEntity }
