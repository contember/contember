import { DataBindingEventListenerMap } from '@contember/binding'
import { useEffect } from 'react'
import { useBindingOperations } from '../accessorPropagation'
import { useReferentiallyStableCallback } from '@contember/react-utils'

export const useDataBindingEvent = <Type extends keyof DataBindingEventListenerMap>(
	event: Type,
	listener: DataBindingEventListenerMap[Type],
): void => {
	const { addEventListener } = useBindingOperations()
	const listenerStable = useReferentiallyStableCallback(listener as any)
	useEffect(() => {
		const unsubscribe = addEventListener(event, listenerStable)
		return () => unsubscribe()
	}, [addEventListener, event, listenerStable])
}
