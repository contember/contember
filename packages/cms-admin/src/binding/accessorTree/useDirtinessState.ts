import * as React from 'react'
import { AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateContext } from './AccessorTreeStateContext'

export const useDirtinessState = () => {
	const accessorTreeState = React.useContext(AccessorTreeStateContext)

	return accessorTreeState.name === AccessorTreeStateName.Interactive ||
		accessorTreeState.name === AccessorTreeStateName.Mutating
		? accessorTreeState.isDirty
		: false
}
