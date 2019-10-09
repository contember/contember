import * as React from 'react'
import { AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateContext } from './AccessorTreeStateContext'

export const useMutationState = () => {
	const accessorTreeState = React.useContext(AccessorTreeStateContext)

	return accessorTreeState.name === AccessorTreeStateName.Mutating
}
