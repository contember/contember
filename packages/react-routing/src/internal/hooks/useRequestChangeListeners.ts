import { useCallback, useRef, useState } from 'react'
import { RequestChangeEvent, RequestChangeHandler, RequestState } from '../../types'

export const useRequestChangeListeners = (): {
	addListener: (handler: RequestChangeHandler) => () => void
	fireListeners: (request: RequestState) => Promise<RequestState | undefined>
} => {
	const [listeners, setListeners] = useState<RequestChangeHandler[]>([])
	const listenersRef = useRef(listeners)
	listenersRef.current = listeners

	const fireListeners = useCallback(async (request: RequestState) => {
		let stopped = false
		const event: RequestChangeEvent = { request, abortNavigation: () => (stopped = true) }
		for (const listener of listenersRef.current) {
			await listener(event)
			if (stopped) {
				return undefined
			}
		}
		return event.request
	}, [])

	const addListener = useCallback((handler: RequestChangeHandler) => {
		setListeners(current => [...current, handler])
		return () => {
			setListeners(current => current.filter(h => h !== handler))
		}
	}, [])

	return { addListener, fireListeners }
}
