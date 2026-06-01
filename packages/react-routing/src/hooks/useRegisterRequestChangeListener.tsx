import { useAddRequestChangeListener } from '../contexts.js'
import { useEffect } from 'react'
import { RequestChangeHandler } from '../types/index.js'

export const useRegisterRequestChangeListener = (listener: RequestChangeHandler) => {
	const add = useAddRequestChangeListener()
	useEffect(() => {
		return add(listener)
	}, [add, listener])
}
