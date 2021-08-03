import { createAction } from 'redux-actions'
import { VIEW_REPLACE } from '../reducer/view'
import type RequestState from '../state/request'
import type ViewState from '../state/view'
import type { ActionCreator } from './types'

const handleRequest =
	(request: RequestState, previous: RequestState): ActionCreator<ViewState> =>
	(dispatch, getState) => {
		//show old view and loading overlay until it is loaded
		dispatch(createAction(VIEW_REPLACE, () => ({ ...getState().view, loading: true }))())
		//do stuff

		return dispatch(createAction(VIEW_REPLACE, () => ({ route: request, loading: false }))())
	}

export default handleRequest
