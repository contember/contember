import { useEffect } from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import type { EntityAccessor } from '@contember/binding'
import type { FieldName } from '@contember/binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'

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
export function useEntityEvent(
	type: 'update',
	listener: EntityAccessor.EntityEventListenerMap['update']
): void

export function useEntityEvent(type: keyof EntityAccessor.RuntimeEntityEventListenerMap, fieldOrListenerIn: unknown, listenerIn?: unknown): void {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)
	// The identity of this function is guaranteed to be stable
	const stableGetEntityReference = potentiallyStaleParent.getAccessor

	const fieldName = typeof fieldOrListenerIn === 'string' ? fieldOrListenerIn : undefined
	const listener = useReferentiallyStableCallback(
		(typeof fieldOrListenerIn === 'function' ? fieldOrListenerIn : listenerIn) as any,
	)

	useEffect(() => {
		// addEventListener returns an unsubscribe function, which we're deliberately re-returning from here.
		const entityAccessor = stableGetEntityReference()
		if (type === 'connectionUpdate') {
			return entityAccessor.addEventListener(
				{ type, key: fieldName },
				listener,
			)
		} else {
			return entityAccessor.addEventListener(
				{ type },
				listener,
			)
		}
	}, [fieldName, listener, stableGetEntityReference, type])
}
