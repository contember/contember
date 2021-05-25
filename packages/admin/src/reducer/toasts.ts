import type { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import ToastsState, { emptyToastsState, Toast, ToastId } from '../state/toasts'

export const TOASTS_ADD = 'toasts_add'
export const TOASTS_DISMISS = 'toasts_dismiss'

export default handleActions<ToastsState, any>(
	{
		[TOASTS_ADD]: (state, action: Action<Toast>): ToastsState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			return { ...state, toasts: [...state.toasts, action.payload] }
		},
		[TOASTS_DISMISS]: (state, action: Action<ToastId>): ToastsState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			return { ...state, toasts: [...state.toasts.filter(t => t.id !== action.payload)] }
		},
	},
	emptyToastsState,
) as Reducer
