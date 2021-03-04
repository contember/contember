import { useCallback } from 'react'
import { addToast } from '../../actions/toasts'
import { useDispatch } from 'react-redux'
import { ToastDefinition } from '../../state/toasts'

export const useAddToast = (): ((toast: ToastDefinition) => void) => {
	const dispatch = useDispatch()
	return useCallback(
		(toast: ToastDefinition) => {
			dispatch(addToast(toast))
		},
		[dispatch],
	)
}
