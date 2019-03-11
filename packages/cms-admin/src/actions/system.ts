import { ActionCreator } from './types'
import { SYSTEM_ADD_DIFF } from '../reducer/system'
import { StageDiffState } from '../state/system'

export const setFetching = (baseStage: string): ActionCreator => async (dispatch, getState, services) => {
	const state = getState()
	const request = state.request
	if (request.name !== 'project_page' || !request.stage) {
		throw new Error()
	}
	const project = request.project
	const headStage = request.stage

	dispatch({
		type: SYSTEM_ADD_DIFF,
		payload: {
			project,
			headStage,
			baseStage,
			state: StageDiffState.DIFF_FETCHING
		}
	})
}

export const fetchDiff = (baseStage: string): ActionCreator => async (dispatch, getState, services) => {
	const state = getState()
	const request = state.request
	if (request.name !== 'project_page' || !request.stage) {
		throw new Error()
	}
	await dispatch(setFetching(baseStage))
	const project = request.project
	const headStage = request.stage
	const systemClient = services.systemClientFactory.create(project)
	const apiToken = state.auth.identity ? state.auth.identity.token : undefined
	const response = await systemClient.request(
		diffQuery,
		{
			headStage: headStage,
			baseStage: baseStage
		},
		apiToken
	)

	dispatch({
		type: SYSTEM_ADD_DIFF,
		payload: {
			project,
			headStage,
			baseStage,
			state:
				response.diff.errors && response.diff.errors.length > 0 ? StageDiffState.DIFF_FAILED : StageDiffState.DIFF_DONE,
			events: response.diff.result && response.diff.result.events,
			errors: response.diff.errors
		}
	})
}

export const executeRelease = (baseStage: string, events: string[]): ActionCreator => async (
	dispatch,
	getState,
	services
) => {
	const state = getState()
	const request = state.request
	if (request.name !== 'project_page' || !request.stage) {
		throw new Error()
	}
	const project = request.project
	const headStage = request.stage
	await dispatch(setFetching(baseStage))
	const systemClient = services.systemClientFactory.create(project)
	const apiToken = state.auth.identity ? state.auth.identity.token : undefined
	await systemClient.request(
		releaseMutation,
		{
			headStage,
			baseStage,
			events: events.filter((val, i, arr) => arr.indexOf(val) === i)
		},
		apiToken
	)

	await dispatch(fetchDiff(baseStage))
}

const diffQuery = `query($baseStage: String!, $headStage: String!) {
			diff(baseStage: $baseStage, headStage: $headStage) {
				errors
				result {
					events {
						id
						dependencies
						description
						allowed
						type
					}
				}
			}
		}`
const releaseMutation = `mutation($baseStage: String!, $headStage: String!, $events: [String!]!) {
				release(baseStage: $baseStage, headStage: $headStage, events: $events) {
					ok
				}
		}`
