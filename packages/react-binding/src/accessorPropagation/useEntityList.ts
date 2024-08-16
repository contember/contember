import { useConstantLengthInvariant, useConstantValueInvariant } from '@contember/react-utils'
import { useCallback } from 'react'
import { useEntityKey, useGetEntityByKey } from './index'
import type { EntityListAccessor } from '@contember/binding'
import { useOnConnectionUpdate } from '../entityEvents'
import type { SugaredRelativeEntityList } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useDesugaredRelativeEntityList } from './useDesugaredRelativeEntityList'

function useEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList): EntityListAccessor
function useEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined
function useEntityList(
	sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined,
): EntityListAccessor | undefined {
	const relativeEntityList = useDesugaredRelativeEntityList(sugaredRelativeEntityList)
	useConstantValueInvariant(
		!!relativeEntityList,
		'useEntityList: cannot alternate between providing and omitting the argument.',
	)

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const getEntityList = useCallback(() => {
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

export { useEntityList }
