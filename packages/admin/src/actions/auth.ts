import { createAction } from 'redux-actions'
import { SET_LOGOUT } from '../reducer/auth'
import { pushRequest } from './request'
import type { Dispatch } from './types'

export const logout = () => (dispatch: Dispatch) => {
	dispatch(createAction(SET_LOGOUT)())
	window.location.href = '/' // TODO: better
	// return dispatch(pushRequest(() => ({ name: 'login' })))
}
