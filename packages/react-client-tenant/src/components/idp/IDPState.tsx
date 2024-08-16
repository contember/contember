import React, { ReactNode } from 'react'
import { IDPStateType } from '../../types'
import { useIDPState } from '../../contexts'

export interface IDPStateProps {
	state: IDPStateType | IDPStateType[]
	children: ReactNode
}

export const IDPState = ({ state, children }: IDPStateProps) => {
	const currentState = useIDPState().type

	return state === currentState || (Array.isArray(state) && state.includes(currentState)) ? <>{children}</> : null
}
