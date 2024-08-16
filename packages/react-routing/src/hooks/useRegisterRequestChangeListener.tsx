import { useAddRequestChangeListener } from '../contexts'
import { useEffect } from 'react'
import { RequestChangeHandler } from '../types'

export const useRegisterRequestChangeListener = (listener: RequestChangeHandler) => {
	const add = useAddRequestChangeListener()
	useEffect(() => {
		return add(listener)
	}, [add, listener])
}
