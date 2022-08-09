import { useContext } from 'react'
import { AccessorTreeStateContext } from './AccessorTreeStateContext'
import { BindingError } from '../BindingError'

export const useAccessorTreeState = () => {
	const state = useContext(AccessorTreeStateContext)
	if (!state) {
		throw new BindingError()
	}
	return state
}
