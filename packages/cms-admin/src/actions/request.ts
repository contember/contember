import { createAction } from 'redux-actions'
import { REQUEST_REPLACE } from '../reducer/request'
import { ActionCreator } from './types'
import { parseParams, buildUrlFromRequest } from '../utils/url'
import { default as RequestState, emptyRequestState, RequestChange } from '../state/request'
import handleRequest from './requestHandler'

export const pushRequest = (requestChange: RequestChange): ActionCreator => (dispatch, getState) => {
	const previousRequest = getState().request
	const request: RequestState = { ...requestChange() }
	dispatch(createAction(REQUEST_REPLACE, () => request)())

	window.history.pushState({}, document.title, buildUrlFromRequest(request))
	dispatch(handleRequest(request, previousRequest))
}

export const populateRequest = (location: Location): ActionCreator => (dispatch, getState) => {
	const params = (parseParams(location.search) as any) as RequestState

	const request: RequestState = {
		...params
	}

	const previousRequest = getState().request
	dispatch(createAction(REQUEST_REPLACE, () => request)())
	dispatch(handleRequest(request, previousRequest))
}
