import { ActionCreator } from './types'
import { createAction } from 'redux-actions'
import { CONTENT_SET_LOADING, CONTENT_SET_DATA } from '../reducer/content'

export const getData = (project: string, stage: string, query: string): ActionCreator => async (
	dispatch,
	getState,
	services
) => {
	dispatch(createAction(CONTENT_SET_LOADING)())
	const apiToken = getState().auth.token
	const data = await services.contentClientFactory.create(project, stage).request(query, {}, apiToken || undefined)
	dispatch(createAction(CONTENT_SET_DATA, () => data)())
}
