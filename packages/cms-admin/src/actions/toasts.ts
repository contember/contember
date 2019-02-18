import { createAction } from 'redux-actions'
import { TOASTS_ADD, TOASTS_DISMISS } from '../reducer/toasts'
import { Toast } from '../state/toasts'

export const addToast = (toast: Toast) => createAction(TOASTS_ADD, () => toast)()
export const dismissToast = (toast: Toast) => createAction(TOASTS_DISMISS, () => toast)()
