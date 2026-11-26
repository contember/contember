import { useConstantLengthInvariant, useConstantValueInvariant } from '@contember/react-utils'
import { useCallback } from 'react'
import { useEntityKey, useGetEntityByKey } from './index.js'
import type { EntityAccessor } from '@contember/binding'
import type { SugaredRelativeSingleEntity } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription.js'
import { useOnHasOneRelationPathConnectionUpdate } from './useOnHasOneRelationPathConnectionUpdate.js'
import { useDesugaredRelativeSingleEntity } from './useDesugaredRelativeSingleEntity.js'

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
		const getEntityAccessor = useCallback(() => getEntityByKey(entityKey), [entityKey, getEntityByKey])
		return useAccessorUpdateSubscription(getEntityAccessor)[0]
	}
	const sugaredRelativeSingleEntity = entity[0]

	const relativeSingleEntity = useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity)
	const getEntity = useCallback(() => {
		const parent = getEntityByKey(entityKey)
		return parent.getEntity(relativeSingleEntity!)
	}, [entityKey, getEntityByKey, relativeSingleEntity])

	if (relativeSingleEntity) {
		useConstantLengthInvariant(
			relativeSingleEntity.hasOneRelationPath,
			'Cannot change the length of the hasOneRelation path!',
		)
		const [entity, { update }] = useAccessorUpdateSubscription(getEntity)

		useOnHasOneRelationPathConnectionUpdate(relativeSingleEntity.hasOneRelationPath, update)

		return entity
	}
	return undefined
}

export { useEntity }
