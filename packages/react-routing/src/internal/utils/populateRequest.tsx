import { RequestState, RoutingContextValue } from '../../types'
import { pathToRequestState, requestStateToPath } from './urlMapper'

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
