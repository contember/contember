import { createAction } from 'redux-actions'
import { TOASTS_ADD, TOASTS_DISMISS } from '../reducer/toasts'
import type { Toast, ToastDefinition, ToastId } from '../state/toasts'

export const addToast = (() => {
	let toastId = 0

	return (toast: ToastDefinition) =>
		createAction<Toast>(TOASTS_ADD, () => ({
			...toast,
			id: `${toastId++}`,
		}))()
})()

export const dismissToast = (toastId: ToastId) => createAction(TOASTS_DISMISS, () => toastId)()
