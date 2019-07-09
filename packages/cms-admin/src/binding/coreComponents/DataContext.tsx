import * as React from 'react'
import { AccessorTreeRoot, EntityAccessor, EntityForRemovalAccessor, Errorable, FieldAccessor } from '../dao'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'

export type DataContextValue = undefined | FieldAccessor | EntityAccessor | AccessorTreeRoot | EntityForRemovalAccessor

type _EntityAccessorErrorable = EnforceSubtypeRelation<EntityAccessor, Errorable>
type _FieldAccessorErrorable = EnforceSubtypeRelation<FieldAccessor, Errorable>

const DataContext = React.createContext<DataContextValue>(undefined)

export { DataContext }
