import { createAction } from 'redux-actions'
import { VIEW_REPLACE } from '../reducer/view'
import RequestState from '../state/request'
import { ActionCreator } from './types'

const handleRequest = (request: RequestState, previous: RequestState): ActionCreator => (dispatch, getState) => {
	//show old view and loading overlay until it is loaded
	dispatch(createAction(VIEW_REPLACE, () => ({ ...getState().view, loading: true }))())
	//do stuff

	dispatch(createAction(VIEW_REPLACE, () => ({ route: request, loading: false }))())
}

export default handleRequest
