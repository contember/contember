import { useDispatch } from 'react-redux'
import { addToast } from '../../actions/toasts'
import { ToastDefinition, ToastId } from '../../state/toasts'
import * as React from 'react'

// TODO this is a very bad place for this file
export const useShowToast = () => {
	const dispatch = useDispatch()

	return React.useCallback(
		(definition: ToastDefinition): ToastId | undefined => {
			const toastAction = addToast(definition)
			dispatch(toastAction)
			return toastAction.payload ? toastAction.payload.id : undefined
		},
		[dispatch],
	)
}
