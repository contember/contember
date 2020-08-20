import { useConstantLengthInvariant, useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { EntityListAccessor } from '../accessors'
import { useOnConnectionUpdate } from '../entityEvents'
import { SugaredRelativeEntityList } from '../treeParameters'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useDesugaredRelativeEntityList } from './useDesugaredRelativeEntityList'

function useRelativeEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList): EntityListAccessor
function useRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined
function useRelativeEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined {
	const relativeEntityList = useDesugaredRelativeEntityList(sugaredRelativeEntityList)
	useConstantValueInvariant(
		!!relativeEntityList,
		'useRelativeEntityList: cannot alternate between providing and omitting the argument.',
	)

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const getEntityList = React.useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getRelativeEntityList(relativeEntityList!)
	}, [entityKey, getEntityByKey, relativeEntityList])

	if (relativeEntityList) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useConstantLengthInvariant(
			relativeEntityList.hasOneRelationPath,
			'Cannot change the length of the hasOneRelation path!',
		)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const [entityList, forceUpdate] = useAccessorUpdateSubscription(getEntityList, true)

		if (relativeEntityList.hasOneRelationPath.length) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useOnConnectionUpdate(relativeEntityList.hasOneRelationPath[0].field, forceUpdate)
		}

		return entityList
	}
	return undefined
}

export { useRelativeEntityList }
