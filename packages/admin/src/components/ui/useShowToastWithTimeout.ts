import { ToastDefinition } from '../../state/toasts'
import { useDismissToast } from './useDismissToast'
import { useShowToast } from './useShowToast'

export const useShowToastWithTimeout = (timeout: number = 4000) => {
	const showToast = useShowToast()
	const dismissToast = useDismissToast()

	return (definition: ToastDefinition) => {
		const toastId = showToast(definition)

		if (toastId !== undefined) {
			setTimeout(() => {
				dismissToast(toastId)
			}, timeout)
		}
	}
}
