import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addToast } from '../../actions/toasts'
import type { ToastDefinition } from '../../state/toasts'

export const useAddToast = (): ((toast: ToastDefinition) => void) => {
	const dispatch = useDispatch()
	return useCallback(
		(toast: ToastDefinition) => {
			dispatch(addToast(toast))
		},
		[dispatch],
	)
}
