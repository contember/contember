import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../reducer/request'
import getRoutes, { PageNotFound } from '../routes'
import type { default as RequestState, RequestChange } from '../state/request'
import type ViewState from '../state/view'
import { pathToRequestState, requestStateToPath } from '../utils/url'
import handleRequest from './requestHandler'
import type { ActionCreator } from './types'

export const pushRequest =
	(requestChange: RequestChange): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		const basePath = getState().basePath
		const previousRequest = getState().request
		const request: RequestState = { ...requestChange(previousRequest) }
		dispatch(createAction(REQUEST_REPLACE, () => request)())

		window.history.pushState(
			{},
			document.title,
			basePath + requestStateToPath(getRoutes(getState().projectsConfigs.configs), request),
		)
		return dispatch(handleRequest(request, previousRequest))
	}

export const populateRequest =
	(location: Location): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		const basePath = getState().basePath

		if (!location.pathname.startsWith(basePath)) {
			throw new PageNotFound('No matching route found (wrong basePath)')
		}

		const routeMap = getRoutes(getState().projectsConfigs.configs)
		const request = pathToRequestState(routeMap, location.pathname.substring(basePath.length))

		if (!request) {
			throw new PageNotFound('No matching route found')
		}

		// Replace with canonical version of the url
		const canonicalPath = basePath + requestStateToPath(routeMap, request)
		if (canonicalPath !== location.pathname) {
			window.history.replaceState({}, document.title, canonicalPath)
		}

		const previousRequest = getState().request
		dispatch(createAction(REQUEST_REPLACE, () => request)())
		return dispatch(handleRequest(request, previousRequest))
	}
