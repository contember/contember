import { createContext } from 'react'
import { AccessorTreeState } from './AccessorTreeState'

export const AccessorTreeStateContext = createContext<AccessorTreeState>({
	name: 'initializing',
})
