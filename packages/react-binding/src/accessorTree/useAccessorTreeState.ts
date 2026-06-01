import { useContext } from 'react'
import { AccessorTreeStateContext } from './AccessorTreeStateContext.js'
import { BindingError } from '@contember/binding'

export const useAccessorTreeState = () => {
	const state = useContext(AccessorTreeStateContext)
	if (!state) {
		throw new BindingError()
	}
	return state
}
