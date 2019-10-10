import * as React from 'react'
import { InteractiveAccessorTreeState, MutatingAccessorTreeState } from './AccessorTreeState'

export type AccessorTreeStateWithDataContextValue = MutatingAccessorTreeState | InteractiveAccessorTreeState | undefined

export const AccessorTreeStateWithDataContext = React.createContext<AccessorTreeStateWithDataContextValue>(undefined)
