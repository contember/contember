import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import AuthState, { AuthIdentity, AuthStatus, emptyAuthState } from '../state/auth'

export const SET_IDENTITY = 'set_identity'
export const SET_ERROR = 'set_error'
export const SET_LOADING = 'set_loading'
export const SET_LOGOUT = 'set_logout'

export default handleActions<AuthState, any>(
	{
		[SET_IDENTITY]: (state: AuthState, action: Action<AuthIdentity>): AuthState => {
			return { ...state, errorMessage: null, status: AuthStatus.LOGGED_IN, identity: action.payload! }
		},
		[SET_ERROR]: (state: AuthState, action: Action<string>): AuthState => {
			return { ...state, errorMessage: action.payload as string, status: AuthStatus.NOT_LOGGED_IN }
		},
		[SET_LOADING]: (state: AuthState, action: Action<undefined>): AuthState => {
			return { ...state, errorMessage: null, status: AuthStatus.LOADING }
		},
		[SET_LOGOUT]: (state: AuthState, action: Action<undefined>): AuthState => {
			return { ...state, errorMessage: null, identity: null, status: AuthStatus.NOT_LOGGED_IN }
		},
	},
	emptyAuthState,
) as Reducer
