import { ToastDefinition } from '../../state/toasts'
import { useDismissToast } from './useDismissToast'
import { useShowToast } from './useShowToast'

export const useShowToastWithTimeout = () => {
	const showToast = useShowToast()
	const dismissToast = useDismissToast()

	return (definition: ToastDefinition, timeout: number = 4000) => {
		const toastId = showToast(definition)

		if (toastId !== undefined) {
			setTimeout(() => {
				dismissToast(toastId)
			}, timeout)
		}
	}
}
