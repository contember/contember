import { useConstantLengthInvariant, useConstantValueInvariant } from '@contember/react-utils'
import { useCallback } from 'react'
import { useEntityKey, useGetEntityByKey } from './index'
import type { EntityAccessor } from '@contember/binding'
import { useOnConnectionUpdate } from '../entityEvents'
import type { SugaredRelativeSingleEntity } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity'

function useEntity(): EntityAccessor
function useEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity): EntityAccessor
function useEntity(
	sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined,
): EntityAccessor | undefined
function useEntity(...entity: [] | [string | SugaredRelativeSingleEntity | undefined]): EntityAccessor | undefined {
	useConstantValueInvariant(entity.length, 'useEntity: cannot alternate between providing and omitting the argument.')

	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()

	if (entity.length === 0) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const getEntityAccessor = useCallback(() => getEntityByKey(entityKey), [entityKey, getEntityByKey])
		// eslint-disable-next-line react-hooks/rules-of-hooks
		return useAccessorUpdateSubscription(getEntityAccessor)
	}
	const sugaredRelativeSingleEntity = entity[0]

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const getEntity = useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getRelativeSingleEntity(relativeSingleEntity!)
	}, [entityKey, getEntityByKey, relativeSingleEntity])

	if (relativeSingleEntity) {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useConstantLengthInvariant(
			relativeSingleEntity.hasOneRelationPath,
			'Cannot change the length of the hasOneRelation path!',
		)
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const [entity, forceUpdate] = useAccessorUpdateSubscription(getEntity, true)

		if (relativeSingleEntity.hasOneRelationPath.length) {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useOnConnectionUpdate(relativeSingleEntity.hasOneRelationPath[0].field, forceUpdate)
		}

		return entity
	}
	return undefined
}

export { useEntity }
