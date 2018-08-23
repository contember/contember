import { Action, handleActions } from 'redux-actions'
import AuthState, { emptyAuthState, AuthStatus } from '../state/auth'
import { Reducer } from 'redux'

export const SET_TOKEN = 'set_token'
export const SET_ERROR = 'set_error'
export const SET_LOADING = 'set_loading'

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
		}
	},
	emptyAuthState
) as Reducer
