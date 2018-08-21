import { ActionCreator } from './types'
import { createAction } from 'redux-actions'
import { CONTENT_SET_LOADING, CONTENT_SET_DATA, CONTENT_SET_NONE } from '../reducer/content'
import GraphqlClient from '../model/GraphqlClient'
import { pushRequest } from './request'
import { loginRequest } from '../state/request'

let idCounter = 1

export const getData = (project: string, stage: string, query: string): ActionCreator => async (
	dispatch,
	getState,
	services
) => {
	const id = (idCounter++).toString(16)
	dispatch(createAction(CONTENT_SET_LOADING, () => ({ id }))())
	const apiToken = getState().auth.token
	try {
		const data = await services.contentClientFactory.create(project, stage).request(query, {}, apiToken || undefined)
		dispatch(createAction(CONTENT_SET_DATA, () => ({ id, data }))())
	} catch (error) {
		dispatch(createAction(CONTENT_SET_NONE, () => ({ id }))())
		if (error instanceof GraphqlClient.GraphqlServerError) {
			try {
				const json = JSON.parse(error.response.body)
				if (
					json.errors &&
					json.errors[0] &&
					json.errors[0].extensions &&
					json.errors[0].extensions.code === 'UNAUTHENTICATED'
				) {
					// Token expired
					dispatch(pushRequest(loginRequest()))
					return
				}
			} catch {
				// Not valid json - API is probably down
			}
		}
		throw error
	}
	return id
}

export const putData = (project: string, stage: string, query: string): ActionCreator => async (
	dispatch,
	getState,
	services
) => {
	const apiToken = getState().auth.token
	try {
		await services.contentClientFactory.create(project, stage).request(query, {}, apiToken || undefined)
		return
	} catch (error) {
		if (error instanceof GraphqlClient.GraphqlServerError) {
			try {
				const json = JSON.parse(error.response.body)
				if (
					json.errors &&
					json.errors[0] &&
					json.errors[0].extensions &&
					json.errors[0].extensions.code === 'UNAUTHENTICATED'
				) {
					// Token expired
					dispatch(pushRequest(loginRequest()))
					return
				}
			} catch {
				// Not valid json - API is probably down
			}
		}
		throw error
	}
}
