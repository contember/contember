import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { RequestState } from '../../types'
import { requestStateToPath } from '../utils/urlMapper'
import { AddRequestListenerContext, CurrentRequestContext, PushRequestContext, useRouting } from '../../contexts'
import { populateRequest } from '../utils/populateRequest'
import { useRequestChangeListeners } from '../hooks/useRequestChangeListeners'


export const RequestProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const routing = useRouting()
	const [request, setRequest] = useState<RequestState>(() => populateRequest(routing, window.location))
	const { fireListeners, addListener } = useRequestChangeListeners()

	const requestRef = useRef(request)
	requestRef.current = request

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

