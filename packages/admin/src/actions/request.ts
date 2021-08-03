import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../reducer/request'
import routes, { PageNotFound } from '../routes'
import type { default as RequestState, RequestChange } from '../state/request'
import type ViewState from '../state/view'
import { pathToRequestState, requestStateToPath } from '../utils/url'
import handleRequest from './requestHandler'
import type { ActionCreator } from './types'

export const pushRequest =
	(requestChange: RequestChange): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		const previousRequest = getState().request
		const request: RequestState = { ...requestChange(previousRequest) }
		dispatch(createAction(REQUEST_REPLACE, () => request)())

		window.history.pushState(
			{},
			document.title,
			requestStateToPath(routes(getState().projectsConfigs.configs), request),
		)
		return dispatch(handleRequest(request, previousRequest))
	}

export const populateRequest =
	(location: Location): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		const routeMap = routes(getState().projectsConfigs.configs)
		const request = pathToRequestState(routeMap, location.pathname)

		if (!request) {
			throw new PageNotFound('No matching route found')
		}

		// Replace with canonical version of the url
		const canonicalPath = requestStateToPath(routeMap, request)
		if (canonicalPath !== location.pathname) {
			window.history.replaceState({}, document.title, canonicalPath)
		}

		const previousRequest = getState().request
		dispatch(createAction(REQUEST_REPLACE, () => request)())
		return dispatch(handleRequest(request, previousRequest))
	}
