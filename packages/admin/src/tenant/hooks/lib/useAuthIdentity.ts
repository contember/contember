import { shallowEqual, useSelector } from 'react-redux'
import type State from '../../../state'

export const useAuthIdentity = () =>
	useSelector((state: State) => {
		const identity = state.auth.identity
		return identity === null ? undefined : identity
	}, shallowEqual)
