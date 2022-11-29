import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { RequestParameters, PageRequest, RequestChange, RequestState } from './types'
import { RoutingContextValue, useRouting } from './RoutingContext'
import { pathToRequestState, requestStateToPath } from './urlMapper'


export const requestChangeFactory =
	<P extends RequestParameters>(pageName: string, parameters?: P): RequestChange =>
	(currentState: RequestState): PageRequest<P> => ({
		pageName,
		parameters: parameters ?? {} as P,
		dimensions: currentState?.dimensions || {},
	})


export const CurrentRequestContext = createContext<RequestState>(null)
CurrentRequestContext.displayName = 'CurrentRequestContext'

export const PushRequestContext = createContext<(req: RequestState) => void>(() => {})
PushRequestContext.displayName = 'PushRequestContext'

export const useCurrentRequest = () => useContext(CurrentRequestContext)
export const usePushRequest = () => useContext(PushRequestContext)

export const RequestProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const routing = useRouting()
	const [request, setRequest] = useState<RequestState>(() => populateRequest(routing, window.location))

	useEffect(
		() => {
			const onPopState = (e: PopStateEvent) => {
				e.preventDefault()
				setRequest(populateRequest(routing, window.location))
			}

			window.addEventListener('popstate', onPopState)

			return () => {
				window.removeEventListener('popstate', onPopState)
			}
		},
		[routing],
	)

	const pushRequest = useCallback(
		(request: RequestState) => {
			setRequest(request)
			window.history.pushState({}, document.title, requestStateToPath(routing, request))
		},
		[routing],
	)

	return (
		<CurrentRequestContext.Provider value={request}>
			<PushRequestContext.Provider value={pushRequest}>
				{children}
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
