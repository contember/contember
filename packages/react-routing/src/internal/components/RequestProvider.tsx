import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { RequestChangeEvent, RequestChangeHandler, RequestState } from '../../types'
import { requestStateToPath } from '../utils/urlMapper'
import { AddRequestListenerContext, CurrentRequestContext, PushRequestContext, useRouting } from '../../contexts'
import { populateRequest } from '../utils/populateRequest'


export const RequestProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const routing = useRouting()
	const [request, setRequest] = useState<RequestState>(() => populateRequest(routing, window.location))
	const [listeners, setListeners] = useState<RequestChangeHandler[]>([])

	const listenersRef = useRef(listeners)
	listenersRef.current = listeners

	const requestRef = useRef(request)
	requestRef.current = request

	const fireListeners = useCallback(async (request: RequestState) => {
		const event: RequestChangeEvent = { request }
		for (const listener of listenersRef.current) {
			await listener(event)
			if (event.request === undefined) {
				return
			}
		}
		return event.request
	}, [])

	const pushHistoryState = useCallback((request: RequestState) => {
		const newUrl = requestStateToPath(routing, request)
		if (newUrl === window.location.pathname + window.location.search) {
			return
		}
		window.history.pushState({}, document.title, newUrl)
	}, [routing])

	useEffect(
		() => {
			const onPopState = async (e: PopStateEvent) => {
				e.preventDefault()
				const newRequest = populateRequest(routing, window.location)
				const finalRequest = await fireListeners(newRequest)
				if (finalRequest === undefined) {
					pushHistoryState(requestRef.current)
				} else if (finalRequest !== newRequest) {
					pushHistoryState(finalRequest)
					setRequest(finalRequest)
				} else {
					setRequest(newRequest)
				}
			}

			window.addEventListener('popstate', onPopState)

			return () => {
				window.removeEventListener('popstate', onPopState)
			}
		},
		[fireListeners, pushHistoryState, routing],
	)

	const pushRequest = useCallback(
		async (request: RequestState) => {
			const newRequest = await fireListeners(request)
			if (newRequest === undefined) {
				return
			}
			setRequest(newRequest)
			pushHistoryState(newRequest)
		},
		[fireListeners, pushHistoryState],
	)

	const addListener = useCallback((handler: RequestChangeHandler) => {
		setListeners(current => [...current, handler])
		return () => {
			setListeners(current => current.filter(h => h !== handler))
		}
	}, [])

	return (
		<CurrentRequestContext.Provider value={request}>
			<PushRequestContext.Provider value={pushRequest}>
				<AddRequestListenerContext.Provider value={addListener}>
					{children}
				</AddRequestListenerContext.Provider>
			</PushRequestContext.Provider>
		</CurrentRequestContext.Provider>
	)
}

