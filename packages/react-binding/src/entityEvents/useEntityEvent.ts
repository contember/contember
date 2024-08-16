import { useEffect } from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import type { EntityAccessor } from '@contember/binding'
import type { FieldName } from '@contember/binding'

export function useEntityEvent(
	type: 'beforePersist',
	listener: EntityAccessor.EntityEventListenerMap['beforePersist'],
): void
export function useEntityEvent(
	type: 'beforeUpdate',
	listener: EntityAccessor.EntityEventListenerMap['beforeUpdate'],
): void
export function useEntityEvent(
	type: 'connectionUpdate',
	hasOneField: FieldName,
	listener: EntityAccessor.EntityEventListenerMap['connectionUpdate'],
): void
export function useEntityEvent(
	type: 'persistError',
	listener: EntityAccessor.EntityEventListenerMap['persistError'],
): void
export function useEntityEvent(
	type: 'persistSuccess',
	listener: EntityAccessor.EntityEventListenerMap['persistSuccess'],
): void
export function useEntityEvent(type: 'update', listener: EntityAccessor.EntityEventListenerMap['update']): void
export function useEntityEvent(type: keyof EntityAccessor.RuntimeEntityEventListenerMap, ...args: unknown[]): void {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)

	// The identity of this function is guaranteed to be stable
	const stableGetEntityReference = potentiallyStaleParent.getAccessor

	useEffect(() => {
		// addEventListener returns an unsubscribe function, which we're deliberately re-returning from here.
		const entityAccessor = stableGetEntityReference()
		if (type === 'connectionUpdate') {
			return entityAccessor.addEventListener(
				{
					type,
					key: args[0] as string,
				},
				args[1] as any,
			)
		} else {
			return entityAccessor.addEventListener(
				{
					type,
				},
				args[0] as any,
			)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...args, stableGetEntityReference])
}
