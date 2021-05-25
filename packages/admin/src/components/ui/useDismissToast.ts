import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { dismissToast } from '../../actions/toasts'
import type { ToastId } from '../../state/toasts'

// TODO this is a very bad place for this file
export const useDismissToast = () => {
	const dispatch = useDispatch()

	return useCallback((toastId: ToastId) => dispatch(dismissToast(toastId)), [dispatch])
}
