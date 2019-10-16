import * as React from 'react'
import { AccessorTreeStateWithData } from './AccessorTreeState'

export type AccessorTreeStateWithDataContextValue = AccessorTreeStateWithData | undefined

export const AccessorTreeStateWithDataContext = React.createContext<AccessorTreeStateWithDataContextValue>(undefined)
