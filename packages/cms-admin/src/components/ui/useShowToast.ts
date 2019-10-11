import { useDispatch } from 'react-redux'
import { addToast } from '../../actions/toasts'
import { ToastDefinition } from '../../state/toasts'
import * as React from 'react'

// TODO this is a very bad place for this file
export const useShowToast = () => {
	const dispatch = useDispatch()

	return React.useCallback((definition: ToastDefinition) => dispatch(addToast(definition)), [dispatch])
}
