import * as React from 'react'
import { AccessorTreeRoot, EntityAccessor, EntityForRemovalAccessor, FieldAccessor } from '../dao'

export type DataContextValue = undefined | FieldAccessor | EntityAccessor | AccessorTreeRoot | EntityForRemovalAccessor

const DataContext = React.createContext<DataContextValue>(undefined)

export { DataContext }
