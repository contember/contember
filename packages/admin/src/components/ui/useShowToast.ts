import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { addToast } from '../../actions/toasts'
import { ToastDefinition, ToastId } from '../../state/toasts'

// TODO this is a very bad place for this file
export const useShowToast = () => {
	const dispatch = useDispatch()

	return useCallback(
		(definition: ToastDefinition): ToastId | undefined => {
			const toastAction = addToast(definition)
			dispatch(toastAction)
			return toastAction.payload ? toastAction.payload.id : undefined
		},
		[dispatch],
	)
}
