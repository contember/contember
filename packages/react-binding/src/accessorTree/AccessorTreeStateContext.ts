import { createContext } from 'react'
import { AccessorTreeState } from './AccessorTreeState.js'

export const AccessorTreeStateContext = createContext<AccessorTreeState | undefined>(undefined)
