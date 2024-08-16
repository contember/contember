import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { PageRequest, RequestParameters, RequestState } from './types'
import { RoutingContextValue, useRouting } from './RoutingContext'
import { pathToRequestState, requestStateToPath } from './urlMapper'
import { createRequiredContext } from '@contember/react-utils'


export const requestChangeFactory = <P extends RequestParameters>(pageName: string, parameters?: P) =>
	(currentState: RequestState): PageRequest<P> => ({
		pageName,
		parameters: parameters ?? {} as P,
		dimensions: currentState?.dimensions || {},
	})


export const CurrentRequestContext = createContext<RequestState>(null)
CurrentRequestContext.displayName = 'CurrentRequestContext'

export const PushRequestContext = createContext<(req: RequestState) => void>(() => {})
PushRequestContext.displayName = 'PushRequestContext'

export class RequestChangeEvent {
	constructor(
		public request: RequestState | undefined,
	) {}
}
export type RequestChangeHandler = (event: RequestChangeEvent) => void

const [AddRequestListenerContext, useAddRequestListenerContext] = createRequiredContext<(handler: RequestChangeHandler) => () => void>('AddRequestListenerContext')

export const useCurrentRequest = () => useContext(CurrentRequestContext)
export const usePushRequest = () => useContext(PushRequestContext)

export const useAddRequestChangeListener = (listener: RequestChangeHandler) => {
	const add = useAddRequestListenerContext()
	useEffect(() => {
		const remove = add(listener)
		return remove
	}, [add, listener])
}

export const RequestProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const routing = useRouting()
	const [request, setRequest] = useState<RequestState>(() => populateRequest(routing, window.location))
	const [listeners, setListeners] = useState<RequestChangeHandler[]>([])

	const listenersRef = useRef(listeners)
	listenersRef.current = listeners

	const requestRef = useRef(request)
	requestRef.current = request

	const fireListeners = useCallback(async (request: RequestState) => {
		const event = new RequestChangeEvent(request)
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

export const populateRequest = (routing: RoutingContextValue, location: Location): RequestState => {
	const request = pathToRequestState(routing, location.pathname, location.search)

	// Replace with canonical version of the url
	if (request !== null) {
		const canonicalPath = requestStateToPath(routing, request)

		if (canonicalPath !== location.pathname + location.search) {
			window.history.replaceState({}, document.title, canonicalPath)
		}
	}

	return request
}
