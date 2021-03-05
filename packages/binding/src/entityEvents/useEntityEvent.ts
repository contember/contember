import { useEffect } from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { FieldName } from '../treeParameters/primitives'

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
export function useEntityEvent(...args: any[]): void {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)

	// The identity of this function is guaranteed to be stable
	const stableAddEventListenerReference = potentiallyStaleParent.addEventListener

	useEffect(() => {
		// addEventListener returns an unsubscribe function, which we're deliberately re-returning from here.
		return (stableAddEventListenerReference as any)(...args)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...args, stableAddEventListenerReference])
}
