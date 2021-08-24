import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../reducer/request'
import type { RequestState } from '../state/request'
import type { ActionCreator } from './types'
import { PageNotFound, pathToRequestState, requestStateToPath } from '../routing/urlMapper'
import { RoutingContextValue } from '../routing'

export const populateRequest =
	(routing: RoutingContextValue, location: Location): ActionCreator<RequestState> =>
	dispatch => {
		const request = pathToRequestState(routing, location.pathname)

		if (!request) {
			throw new PageNotFound('No matching route found')
		}

		// Replace with canonical version of the url
		const canonicalPath = requestStateToPath(routing, request)

		if (canonicalPath !== location.pathname) {
			window.history.replaceState({}, document.title, canonicalPath)
		}

		return dispatch(createAction(REQUEST_REPLACE, () => request)())
	}
