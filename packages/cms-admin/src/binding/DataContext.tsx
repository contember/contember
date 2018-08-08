import * as React from 'react'
import EntityAccessor from './EntityAccessor'
import FieldAccessor from './FieldAccessor'

export type DataContextValue = undefined | FieldAccessor | EntityAccessor

const dataContext = React.createContext<DataContextValue>(undefined)

export default dataContext
