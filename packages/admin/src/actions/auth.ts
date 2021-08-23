import { createAction } from 'redux-actions'
import { SET_LOGOUT } from '../reducer/auth'
import { useDispatch } from 'react-redux'
import { useCallback } from 'react'

export const useLogout = () => {
	const dispatch = useDispatch()
	return useCallback((() => {
		dispatch(createAction(SET_LOGOUT)())
		window.location.href = '/'
	}), [dispatch])
}
