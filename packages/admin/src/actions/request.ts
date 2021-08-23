import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../reducer/request'
import type { default as RequestState, RequestChange } from '../state/request'
import type { ActionCreator } from './types'
import { PageNotFound, pathToRequestState, requestStateToPath } from '../routing'

export const pushRequest =
	(requestChange: RequestChange): ActionCreator<RequestState> =>
	(dispatch, getState) => {
		const { basePath, request, projectConfig } = getState()
		const newRequest = requestChange(request)

		if (newRequest !== null) {
			const newPath = requestStateToPath(basePath, projectConfig, newRequest)
			window.history.pushState({}, document.title, newPath)
		}

		return dispatch(createAction(REQUEST_REPLACE, () => newRequest ? { ...newRequest } : null)())
	}

export const populateRequest =
	(location: Location): ActionCreator<RequestState> =>
	(dispatch, getState) => {
		const { basePath, projectConfig } = getState()
		const request = pathToRequestState(basePath, projectConfig, location.pathname)

		if (!request) {
			throw new PageNotFound('No matching route found')
		}

		// Replace with canonical version of the url
		const canonicalPath = requestStateToPath(basePath, projectConfig, request)

		if (canonicalPath !== location.pathname) {
			window.history.replaceState({}, document.title, canonicalPath)
		}

		return dispatch(createAction(REQUEST_REPLACE, () => request)())
	}
