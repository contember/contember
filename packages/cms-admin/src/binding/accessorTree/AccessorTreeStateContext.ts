import * as React from 'react'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'

export const AccessorTreeStateContext = React.createContext<AccessorTreeState>({
	name: AccessorTreeStateName.Uninitialized,
})
