import { useCallback, useContext } from 'react'
import { ToastDefinition, ToastType } from './Toaster'
import { ToasterContext } from './ToasterContext'

export type ToastData = ToastDefinition & { dismiss?: number | boolean}

const TIMEOUT_BY_TYPE: {
	[K in ToastType]: number
} =  {
	error: 10000,
	warning: 8000,
	info: 4000,
	success: 4000,
}

export const useShowToast = (): (toast: ToastData) => void => {
	const toasterContext = useContext(ToasterContext)
	if (!toasterContext) {
		throw new Error('Toaster context is not initialized')
	}
	const { showToast, dismissToast } = toasterContext

	return useCallback(({ dismiss, ...toast }: ToastData) => {
		const id = showToast(toast)
		if (dismiss !== undefined && dismiss !== false) {
			setTimeout(() => {
				dismissToast(id)
			}, typeof dismiss !== 'number' ? TIMEOUT_BY_TYPE[toast.type] : dismiss)
		}
	}, [dismissToast, showToast])
}
