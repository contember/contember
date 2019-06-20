import { createAction } from 'redux-actions'
import GraphqlClient from '../model/GraphqlClient'
import { CONTENT_SET_DATA, CONTENT_SET_LOADING, CONTENT_SET_NONE } from '../reducer/content'
import { loginRequest } from '../state/request'
import { pushRequest } from './request'
import { ActionCreator } from './types'

let requestIdCounter = 0

export const sendContentAPIRequest = (query: string): ActionCreator => async (dispatch, getState, services) => {
	const state = getState()
	if (!('stage' in state.request) || !('project' in state.request)) {
		return
	}
	const id = (requestIdCounter++).toString(16)
	dispatch(createAction(CONTENT_SET_LOADING, () => ({ id }))())
	const apiToken = state.auth.identity ? state.auth.identity.token : undefined
	try {
		const data = await services.contentClientFactory
			.create(state.request.project, state.request.stage)
			.request(query, {}, apiToken || undefined)
		dispatch(createAction(CONTENT_SET_DATA, () => ({ id, data }))())
	} catch (error) {
		dispatch(createAction(CONTENT_SET_NONE, () => ({ id }))())
		if (error instanceof GraphqlClient.GraphqlAuthenticationError) {
			dispatch(pushRequest(loginRequest()))
			return
		}
		throw error
	}
	return id
}
