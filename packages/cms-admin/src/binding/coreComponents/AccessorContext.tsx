import * as React from 'react'
import { EntityAccessor, EntityForRemovalAccessor } from '../dao'

export type AccessorContextValue = undefined | EntityAccessor | EntityForRemovalAccessor

export const AccessorContext = React.createContext<AccessorContextValue>(undefined)
