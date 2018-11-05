import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import AuthState, { AuthStatus, emptyAuthState } from '../state/auth'

export const SET_TOKEN = 'set_token'
export const SET_ERROR = 'set_error'
export const SET_LOADING = 'set_loading'
export const SET_LOGOUT = 'set_logout'

export default handleActions<AuthState, any>(
	{
		[SET_TOKEN]: (state: AuthState, action: Action<string>): AuthState => {
			return { ...state, errorMessage: null, token: action.payload as string, status: AuthStatus.LOGGED_IN }
		},
		[SET_ERROR]: (state: AuthState, action: Action<string>): AuthState => {
			return { ...state, errorMessage: action.payload as string, status: AuthStatus.NOT_LOGGED_IN }
		},
		[SET_LOADING]: (state: AuthState, action: Action<undefined>): AuthState => {
			return { ...state, errorMessage: null, status: AuthStatus.LOADING }
		},
		[SET_LOGOUT]: (state: AuthState, action: Action<undefined>): AuthState => {
			return { ...state, errorMessage: null, token: null, status: AuthStatus.NOT_LOGGED_IN }
		}
	},
	emptyAuthState
) as Reducer
