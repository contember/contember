import React, { ReactNode } from 'react'
import { IdentityStateValue } from '../types'
import { useIdentityState } from '../internal/contexts'

export interface IdentityStateProps {
	state: IdentityStateValue | IdentityStateValue[]
	children: ReactNode
}

export const IdentityState = ({ state, children }: IdentityStateProps) => {
	const currentState = useIdentityState()

	return state === currentState || (Array.isArray(state) && state.includes(currentState)) ? <>{children}</> : null
}
